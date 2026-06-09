# lib/neeti/retriever.rb
module Neeti
  class Retriever
    MINIMUM_RESULTS = 3
    DEFAULT_LIMIT   = 5

    STOPWORDS = %w[i my am is are was were be been have has had do does
                   did will would could should may might a an the in on
                   at to of for with by from about what how why when who
                   which this that me you he she it we they our your their].freeze

    def initialize(llm_classifier:, limit: DEFAULT_LIMIT)
      @llm   = llm_classifier
      @limit = limit
    end

    # @param query [String]
    # @return [Array<Sutra>]
    def retrieve(query)
      results = layer1_metadata(query)
      return finalize(results) if sufficient?(results)

      results = (results + layer2_fts(query)).uniq
      return finalize(results) if sufficient?(results)

      results = (results + layer3_llm(query)).uniq
      return finalize(results) if sufficient?(results)

      results = (results + layer4_graph(results)).uniq
      finalize(results)
    end

    private

    def layer1_metadata(query)
      kw = keywords(query)
      return [] if kw.empty?

      # Build an OR tsquery so that "lazy" matches "laziness" via English stemming
      or_tsquery = kw.map { |k| "plainto_tsquery('english', #{ActiveRecord::Base.connection.quote(k)})" }.join(" || ")
      metadata_tsvector = "to_tsvector('english', array_to_string(" \
                          "COALESCE(themes, '{}') || COALESCE(situations, '{}') || " \
                          "COALESCE(vices, '{}') || COALESCE(virtues, '{}') || " \
                          "COALESCE(emotions, '{}'), ' '))"

      Sutra.where("#{metadata_tsvector} @@ (#{or_tsquery})")
           .limit(@limit * 2).to_a
    end

    def layer2_fts(query)
      Sutra.where("search_vector @@ plainto_tsquery('english', ?)", query)
           .order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(
             ["ts_rank(search_vector, plainto_tsquery('english', ?)) DESC", query]
           )))
           .limit(@limit * 2).to_a
    end

    def layer3_llm(query)
      themes = @llm.classify_themes(query, Theme.pluck(:name))
      return [] if themes.empty?

      Sutra.where("themes && ARRAY[?]::text[]", themes).limit(@limit * 2).to_a
    end

    def layer4_graph(existing)
      seed_themes = existing.flat_map(&:themes).uniq
      return [] if seed_themes.empty?

      expanded   = Theme.expand_related(seed_themes, depth: 2)
      new_themes = expanded - seed_themes
      return [] if new_themes.empty?

      Sutra.where("themes && ARRAY[?]::text[]", new_themes)
           .where.not(id: existing.map(&:id))
           .limit(@limit).to_a
    end

    def sufficient?(r) = r.size >= MINIMUM_RESULTS
    def finalize(r)    = r.uniq.first(@limit)

    def keywords(query)
      query.downcase
           .gsub(/[^a-z\s]/, '')
           .split
           .reject { |w| STOPWORDS.include?(w) || w.length < 3 }
    end
  end
end
