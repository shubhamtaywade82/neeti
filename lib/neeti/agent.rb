module Neeti
  class Agent
    MAX_DOC_CHUNKS = 5
    MAX_DOC_TOKENS = 6000

    def initialize(retriever: nil, provider: nil)
      @retriever = retriever || Retriever.new(llm_classifier: LlmClassifier.new)
      @provider  = provider  || ModelRouter.for(:advice)
    end

    def advise(query, user:, conversation:, stream_proc: nil, mode: :retrieval, advisor: :chanakya, retrieval_scope: 'library')
      pack_ids = if user.installed_packs.present?
        KnowledgePack.where(slug: user.installed_packs).pluck(:id)
      end

      retriever = @retriever || Retriever.new(llm_classifier: LlmClassifier.new, pack_ids: pack_ids)

      sutras, context_text, doc_chunks = if mode == :cag
        installed_slugs = user.installed_packs || ['chanakya']
        all = Sutra.joins(:knowledge_pack).where(knowledge_packs: { slug: installed_slugs }).to_a
        [all, all.map(&:translation_en).join("\n"), []]
      else
        retrieved = if %w[library all].include?(retrieval_scope)
          retriever.retrieve(query)
        else
          []
        end
        doc_chunks = if %w[documents all].include?(retrieval_scope)
          retrieve_user_docs(query, user, scope: retrieval_scope)
        else
          []
        end
        [retrieved, nil, doc_chunks]
      end

      insights = MemoryStore.retrieve_insights(user)
      messages = build_messages(query, sutras, insights, conversation, doc_chunks: doc_chunks, corpus_text: context_text, advisor: advisor)

      draft = @provider.chat(messages: messages, stream: stream_proc || false)

      all_sources = sutras + doc_chunks.map(&:document)
      reflection = needs_reflection?(all_sources, draft) ? reflect(draft, query, all_sources) : skip_reflection
      final = reflection[:good] ? draft : refine(draft, reflection, messages)

      InsightExtractionJob.perform_later(user.id, query, final)

      {
        advice: final,
        cited_sutra_ids: sutras.map(&:id),
        cited_document_ids: doc_chunks.map(&:document_id).uniq,
        reflection_score: reflection[:score]
      }
    end

    private

    def retrieve_user_docs(query, user, scope: 'documents')
      return [] unless user.documents.ready.exists?

      query_embedding = embed_query(query)
      return [] if query_embedding.blank?

      chunks = DocumentChunk.joins(:document).where(documents: { user_id: user.id, status: 'ready' })

      if scope.start_with?('collection:')
        collection_id = scope.split(':').last.to_i
        chunks = chunks.where(documents: { collection_id: collection_id })
      end

      chunks.similar_to(query_embedding, limit: MAX_DOC_CHUNKS)
    end

    def embed_query(query)
      require 'net/http'
      require 'json'
      require 'uri'

      uri = URI.parse("#{ENV.fetch('OLLAMA_URL', 'http://localhost:11434')}/api/embed")
      http = Net::HTTP.new(uri.host, uri.port)
      http.open_timeout = 10
      http.read_timeout = 30

      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request.body = { model: 'nomic-embed-text', input: [query] }.to_json
      response = http.request(request)

      if response.code.to_i == 200
        JSON.parse(response.body)['embeddings']&.first
      end
    rescue => e
      Rails.logger.error("Query embedding error: #{e.message}")
      nil
    end

    def build_messages(query, sutras, insights, conversation, doc_chunks: [], corpus_text: nil, advisor: :chanakya)
      history = conversation.messages.order(created_at: :desc).limit(6).reverse.map do |m|
        { role: m.role, content: m.content }
      end

      user_content = if corpus_text
        mem = insights.any? ? "\nUser context:\n#{insights.map(&:content).join("\n")}" : ""
        "#{mem}\n\nFull Chanakya Neeti corpus (455 sutras):\n#{corpus_text}\n\nUser question: #{query}"
      else
        context_parts = []
        context_parts << "Curated knowledge:\n#{sutras.map(&:translation_en).join("\n")}" if sutras.any?
        if doc_chunks.any?
          docs_text = doc_chunks.map { |c| "[#{c.document.filename}]: #{c.content}" }.join("\n\n")
          context_parts << "User documents:\n#{docs_text}"
        end
        mem = insights.any? ? "\nUser context:\n#{insights.map(&:content).join("\n")}" : ""
        "#{mem}\n\n#{context_parts.join("\n\n")}\n\nUser question: #{query}"
      end

      system_prompt = if doc_chunks.any?
        Prompts.system_prompt_for(advisor) + "\n\nThe user has uploaded personal documents. Use the provided document excerpts as context when answering. Always cite the document filename when referencing information from user documents."
      else
        Prompts.system_prompt_for(advisor)
      end

      [
        { role: "system", content: system_prompt },
        *history,
        { role: "user",   content: user_content }
      ]
    end

    def needs_reflection?(sources, draft)
      sources.size < 2 && draft.split.length < 40
    end

    def skip_reflection
      { good: true, issues: [], score: 8 }
    end

    def reflect(draft, query, sources)
      source_texts = sources.map { |s| s.respond_to?(:translation_en) ? s.translation_en : s.content }.join(' | ')
      msgs = [
        { role: "system", content: Prompts::REFLECTION_SYSTEM },
        { role: "user",   content: "Question: #{query}\nSources: #{source_texts}\nDraft: #{draft}\nEvaluate." }
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
