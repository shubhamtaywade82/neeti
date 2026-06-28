# frozen_string_literal: true

module Neeti
  class Agent
    def initialize(retriever: nil, provider: nil)
      @retriever = retriever || Retriever.new(llm_classifier: LlmClassifier.new)
      @provider  = provider  || ModelRouter.for(:advice)
    end

    # @param query        [String]
    # @param user         [User]
    # @param conversation [Conversation]
    # @param stream_proc  [Proc, nil] receives token strings for SSE
    # @param mode         [Symbol] :retrieval (default) or :cag (full corpus)
    # @return [Hash] { advice:, cited_sutra_ids:, reflection_score: }
    def advise(query, user:, conversation:, stream_proc: nil, mode: :retrieval, advisor: :chanakya)
      sutras, context_text = if advisor.to_sym == :chanakya
        if mode == :cag
          [CorpusCache.all_sutras, CorpusCache.corpus_text]
        else
          retrieved = @retriever.retrieve(query)
          [retrieved, nil]
        end
      else
        [[], nil]
      end

      insights = MemoryStore.retrieve_insights(user)
      messages = build_messages(query, sutras, insights, conversation, corpus_text: context_text, advisor: advisor)

      draft = @provider.chat(messages: messages, stream: stream_proc || false)

      reflection = needs_reflection?(sutras, draft) ? reflect(draft, query, sutras) : skip_reflection
      final = reflection[:good] ? draft : refine(draft, reflection, messages)

      InsightExtractionJob.perform_later(user.id, query, final)

      { advice: final, cited_sutra_ids: sutras.map(&:id), reflection_score: reflection[:score] }
    end

    private

    def build_messages(query, sutras, insights, conversation, corpus_text: nil, advisor: :chanakya)
      history = conversation.messages.order(created_at: :desc).limit(6).reverse.map do |m|
        { role: m.role, content: m.content }
      end

      user_content = if corpus_text
        mem = insights.any? ? "\nUser context:\n#{insights.map(&:content).join("\n")}" : ""
        "#{mem}\n\nFull Chanakya Neeti corpus (455 sutras):\n#{corpus_text}\n\nUser question: #{query}"
      else
        Prompts.advice_user_message(query, sutras, insights)
      end

      [
        { role: "system", content: Prompts.system_prompt_for(advisor) },
        *history,
        { role: "user",   content: user_content }
      ]
    end

    # Reflect only when retrieval is weak or draft is suspiciously short.
    # Skipping saves ~50% token cost on confident queries.
    def needs_reflection?(sutras, draft)
      sutras.size < 2 && draft.split.length < 40
    end

    def skip_reflection
      { good: true, issues: [], score: 8 }
    end

    def reflect(draft, query, sutras)
      msgs = [
        { role: "system", content: Prompts::REFLECTION_SYSTEM },
        { role: "user",   content: "Question: #{query}\nSutras: #{sutras.map(&:translation_en).join(' | ')}\nDraft: #{draft}\nEvaluate." }
      ]
      raw    = @provider.chat(messages: msgs)
      parsed = JSON.parse(raw.match(/\{.*\}/m)&.to_s || '{"good":true,"issues":[],"score":7}')
      { good: parsed["good"] == true, issues: Array(parsed["issues"]), score: parsed["score"].to_i }
    rescue JSON::ParserError
      { good: true, issues: [], score: 7 }
    end

    def refine(draft, reflection, original_messages)
      refine_msgs = original_messages + [
        { role: "assistant", content: draft },
        { role: "user",      content: "Issues: #{reflection[:issues].join(', ')}. Rewrite addressing these." }
      ]
      @provider.chat(messages: refine_msgs)
    end
  end
end
