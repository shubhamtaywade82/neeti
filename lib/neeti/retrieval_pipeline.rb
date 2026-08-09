# lib/neeti/retrieval_pipeline.rb
module Neeti
  class RetrievalPipeline
    MINIMUM_RESULTS = 3
    DEFAULT_LIMIT   = 5
    
    # Channel weights for RRF fusion (higher = more important)
    CHANNEL_WEIGHTS = {
      metadata:     1.0,
      fts:          2.0,
      llm:          1.5,
      graph:        1.0,
      embedding:    1.5,
      user_docs:    1.0
    }.freeze
    
    STOPWORDS = %w[i my am is are was were be been have has had do does
                   did will would could should may might a an the in on
                   at to of for with by from about what how why when who
                   which this that me you he she it we they our your their].freeze

    # Keyword → theme name mapping for exact metadata matching
    SYNONYM_MAP = {
      "procrastinate"     => %w[laziness self-discipline],
      "procrastination"   => %w[laziness self-discipline],
      "lazy"              => %w[laziness self-discipline],
      "unmotivated"       => %w[laziness effort],
      "discipline"        => %w[self-discipline],
      "focus"             => %w[self-discipline effort],
      "distraction"       => %w[laziness self-discipline],
      "concentrate"       => %w[self-discipline effort],
      "betray"            => %w[betrayal trust enemies],
      "betrayal"          => %w[betrayal trust enemies],
      "traitor"           => %w[betrayal enemies],
      "credit"            => %w[betrayal trust],  # taking credit for others' work
      "angry"             => %w[anger patience self-discipline],
      "anger"             => %w[anger patience],
      "temper"            => %w[anger self-discipline],
      "furious"           => %w[anger],
      "dishonest"         => %w[betrayal trust],
      "liar"              => %w[betrayal trust],
      "lies"              => %w[betrayal trust],
      "fear"              => %w[fear courage strategy],
      "afraid"            => %w[fear courage],
      "scared"            => %w[fear courage],
      "anxiety"           => %w[fear],
      "worry"             => %w[fear],
      "risk"              => %w[courage strategy fear],
      "greedy"            => %w[greed desire contentment],
      "greed"             => %w[greed desire],
      "wealth"            => %w[wealth greed contentment],
      "money"             => %w[wealth greed],
      "obsessed"          => %w[desire greed],
      "leader"            => %w[leadership strategy wisdom],
      "leadership"        => %w[leadership strategy wisdom],
      "manage"            => %w[leadership strategy],
      "team"              => %w[leadership loyalty trust],
      "jealous"           => %w[desire contentment],
      "jealousy"          => %w[desire contentment],
      "envious"           => %w[desire contentment],
      "office"            => %w[strategy enemies leadership],
      "politics"          => %w[strategy enemies wisdom],
      "manipulation"      => %w[strategy enemies],
      "impulsive"         => %w[wisdom patience self-discipline],
      "impulsivity"       => %w[wisdom self-discipline],
      "regret"            => %w[wisdom patience],
      "motivate"          => %w[leadership strategy],
      "failure"           => %w[fear courage wisdom],
      "rumors"            => %w[enemies strategy loyalty],
      "false"             => %w[enemies betrayal],
      "knowledge"         => %w[knowledge wisdom learning],
      "wisdom"            => %w[wisdom knowledge],
      "learn"             => %w[knowledge wisdom learning],
      "enemy"             => %w[enemies strategy wisdom],
      "powerful"          => %w[strategy enemies],
      "spend"             => %w[wealth self-discipline contentment],
      "reckless"          => %w[wealth self-discipline],
      "savings"           => %w[wealth contentment],
      "child"             => %w[family wisdom patience],
      "parent"            => %w[family wisdom duty],
      "empty"             => %w[contentment wisdom desire],
      "success"           => %w[contentment wisdom],
      "negotiate"         => %w[strategy wealth wisdom],
      "salary"            => %w[wealth strategy],
      "loyal"             => %w[loyalty leadership trust],
      "flatterers"        => %w[wisdom enemies betrayal],
      "flattery"          => %w[wisdom enemies],
      "decisions"         => %w[fear courage patience],
      "delaying"          => %w[fear courage],
      "friend"            => %w[friendship trust loyalty],
      "arguments"         => %w[anger patience],
      "advisors"          => %w[trust wisdom loyalty],
      "trustworthy"       => %w[trust wisdom loyalty],
      "overwhelmed"       => %w[effort self-discipline wisdom],
      "workload"          => %w[effort self-discipline],
      "competitor"        => %w[strategy enemies wisdom],
      "copying"           => %w[strategy enemies],
      "mental"            => %w[courage self-discipline wisdom],
      "resilience"        => %w[courage self-discipline],
      "strength"          => %w[courage self-discipline],
      "giving"            => %w[wisdom enemies self-discipline],
      "advantage"         => %w[wisdom enemies],
      "long-term"         => %w[wisdom strategy patience],
      "mistakes"          => %w[wisdom knowledge self-discipline],
      "past"              => %w[wisdom knowledge],
      "conflict"          => %w[strategy conflict wisdom],
      "partner"           => %w[strategy conflict],
      "friendship"        => %w[friendship trust loyalty],
      "genuine"           => %w[friendship trust],
      "balance"           => %w[self-discipline wisdom family],
      "humiliation"       => %w[courage wisdom patience],
      "public"            => %w[courage wisdom],
      "comparing"         => %w[contentment wisdom desire],
      "compare"           => %w[contentment wisdom],
      "employees"         => %w[loyalty leadership trust],
      "disloyal"          => %w[loyalty leadership],
      "responsibilities"  => %w[family duty wisdom],
      "goal"              => %w[self-discipline effort],
      "delegate"          => %w[leadership trust wisdom],
      "distracted"        => %w[self-discipline laziness effort],
      "failing"           => %w[strategy wisdom courage],
      "business"          => %w[strategy wisdom],
      "accusations"       => %w[enemies strategy wisdom],
      "real wealth"       => %w[wealth wisdom contentment],
      "motivation"        => %w[wisdom effort self-discipline],
      "purpose"           => %w[wisdom self-discipline],
      "raise"             => %w[family knowledge self-discipline],
      "educate"           => %w[family knowledge],
      "strategic"         => %w[strategy wisdom leadership],
      "thinking"          => %w[strategy wisdom knowledge],
    }.freeze

    def initialize(llm_classifier:, limit: DEFAULT_LIMIT, pack_ids: nil, user: nil)
      @llm      = llm_classifier
      @limit    = limit
      @pack_ids = pack_ids
      @user     = user
    end

    # @param query [String]
    # @return [Array<Sutra>]
    def retrieve(query)
      channel_results = {
        metadata:  channel_metadata(query),
        fts:       channel_fts(query),
        llm:       channel_llm(query),
        graph:     [],
        embedding: channel_embedding(query),
        user_docs: channel_user_docs(query)
      }
      
      # Run graph expansion on combined results from other channels
      seed_sutras = (channel_results[:metadata] + channel_results[:fts] + channel_results[:llm]).uniq
      channel_results[:graph] = channel_graph(seed_sutras)
      
      # Apply RRF fusion across all channels
      fused_results = rrf_fusion(channel_results)
      
      finalize(fused_results)
    end

    private

    # Channel 1: Metadata match (synonym expansion + tsquery on join tables)
    def channel_metadata(query)
      expanded_keywords = expand_keywords(query)
      return [] if expanded_keywords.empty?

      or_tsquery = expanded_keywords.map { |k| "plainto_tsquery('english', #{ActiveRecord::Base.connection.quote(k)})" }.join(" || ")

      metadata_tsvector = <<~SQL
        to_tsvector('english', coalesce((
          SELECT string_agg(t.name, ' ')
          FROM sutra_themes st
          INNER JOIN themes t ON t.id = st.theme_id
          WHERE st.sutra_id = sutras.id
        ), '')) ||
        to_tsvector('english', coalesce((
          SELECT string_agg(t.name, ' ')
          FROM sutra_virtues sv
          INNER JOIN themes t ON t.id = sv.theme_id
          WHERE sv.sutra_id = sutras.id
        ), '')) ||
        to_tsvector('english', coalesce((
          SELECT string_agg(t.name, ' ')
          FROM sutra_vices sv
          INNER JOIN themes t ON t.id = sv.theme_id
          WHERE sv.sutra_id = sutras.id
        ), '')) ||
        to_tsvector('english', coalesce((
          SELECT string_agg(t.name, ' ')
          FROM sutra_situations ss
          INNER JOIN themes t ON t.id = ss.theme_id
          WHERE ss.sutra_id = sutras.id
        ), '')) ||
        to_tsvector('english', coalesce((
          SELECT string_agg(t.name, ' ')
          FROM sutra_emotions se
          INNER JOIN themes t ON t.id = se.theme_id
          WHERE se.sutra_id = sutras.id
        ), ''))
      SQL

      base_scope.retrievable.where("#{metadata_tsvector} @@ (#{or_tsquery})")
           .limit(@limit * 2).to_a
    end

    # Channel 2: Full-text search (tsvector + GIN index)
    def channel_fts(query)
      base_scope.retrievable.where("search_vector @@ plainto_tsquery('english', ?)", query)
           .order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(
             ["ts_rank(search_vector, plainto_tsquery('english', ?)) DESC", query]
           )))
           .limit(@limit * 2).to_a
    end

    # Channel 3: LLM theme classification
    def channel_llm(query)
      themes = @llm.classify_themes(query, Theme.pluck(:name))
      return [] if themes.empty?

      sutra_ids = SutraTheme.where(theme_id: Theme.where(name: themes).select(:id))
                    .distinct
                    .pluck(:sutra_id)
      base_scope.retrievable.where(id: sutra_ids).limit(@limit * 2).to_a
    end

    # Channel 4: Graph expansion via theme relationships
    def channel_graph(existing)
      seed_themes = existing.flat_map { |s| s.themes.map(&:name) }.uniq
      return [] if seed_themes.empty?

      expanded   = Theme.expand_related(seed_themes, depth: 2)
      new_themes = expanded - seed_themes
      return [] if new_themes.empty?

      sutra_ids = SutraTheme.where(theme_id: Theme.where(name: new_themes).select(:id))
                    .where.not(sutra_id: existing.map(&:id))
                    .distinct
                    .pluck(:sutra_id)
      base_scope.retrievable.where(id: sutra_ids).limit(@limit).to_a
    end

    # Channel 5: Embedding cosine similarity (NEW)
    def channel_embedding(query)
      return [] unless Sutra.column_names.include?('embedding')
      
      query_embedding = embed_query(query)
      return [] if query_embedding.blank?

      # Use pgvector cosine distance operator (<=>)
      # Order by similarity and return top results
      sutras = base_scope.retrievable
        .where.not(embedding: nil)
        .order(Arel.sql("embedding <=> ?", "[#{query_embedding.join(',')}]"))
        .limit(@limit * 2)
        .to_a
      
      sutras
    rescue => e
      Rails.logger.error("Embedding retrieval error: #{e.message}")
      []
    end

    # Channel 6: User document RAG (preserved from original Retriever)
    def channel_user_docs(query)
      return [] unless @user && @user.documents.ready.exists?
      
      query_embedding = embed_query(query)
      return [] if query_embedding.blank?

      chunks = DocumentChunk.joins(:document)
        .where(documents: { user_id: @user.id, status: 'ready' })
        .similar_to(query_embedding, limit: MAX_DOC_CHUNKS)
      
      # Return as hash to distinguish from Sutra objects
      chunks.map { |c| { type: :document_chunk, chunk: c, document: c.document } }
    end

    # Reciprocal Rank Fusion across all channels
    def rrf_fusion(channel_results)
      rank_scores = Hash.new(0)
      k = 60  # RRF constant
      
      channel_results.each do |channel, results|
        weight = CHANNEL_WEIGHTS[channel]
        results.each_with_index do |result, idx|
          # Extract sutra ID (handle both Sutra objects and document chunks)
          sutra_id = result.is_a?(Sutra) ? result.id : nil
          next unless sutra_id
          
          rank_scores[sutra_id] += weight / (k + idx + 1)
        end
      end
      
      # Sort by fused score and return Sutra objects
      sorted_ids = rank_scores.sort_by { |_, score| -score }.map(&:first)
      Sutra.where(id: sorted_ids).index_by(&:id).values_at(*sorted_ids).compact
    end

    def sufficient?(r) = r.size >= MINIMUM_RESULTS
    def finalize(r)    = r.uniq.first(@limit)

    def keywords(query)
      query.downcase
           .gsub(/[^a-z\s]/, '')
           .split
           .reject { |w| STOPWORDS.include?(w) || w.length < 3 }
    end

    def expand_keywords(query)
      base_keywords = keywords(query)
      expanded = base_keywords.dup

      base_keywords.each do |kw|
        SYNONYM_MAP[kw]&.each { |syn| expanded << syn }
      end

      expanded.uniq
    end

    def base_scope
      scope = Sutra.all
      scope = scope.where(knowledge_pack_id: @pack_ids) if @pack_ids.present?
      scope
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
  end
end
