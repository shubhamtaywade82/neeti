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
    # @return [Hash] { advice:, cited_sutra_ids:, reflection_score: }
    def advise(query, user:, conversation:, stream_proc: nil)
      sutras   = @retriever.retrieve(query)
      insights = MemoryStore.retrieve_insights(user)
      messages = build_messages(query, sutras, insights, conversation)

      draft = @provider.chat(messages: messages, stream: stream_proc || false)

      reflection = reflect(draft, query, sutras)
      final = reflection[:good] ? draft : refine(draft, reflection, messages)

      InsightExtractionJob.perform_later(user.id, query, final)

      { advice: final, cited_sutra_ids: sutras.map(&:id), reflection_score: reflection[:score] }
    end

    private

    def build_messages(query, sutras, insights, conversation)
      history = conversation.messages.order(:created_at).last(6).map do |m|
        { role: m.role, content: m.content }
      end
      [
        { role: "system", content: Prompts::CHANAKYA_SYSTEM },
        *history,
        { role: "user",   content: Prompts.advice_user_message(query, sutras, insights) }
      ]
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
