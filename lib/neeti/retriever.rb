# lib/neeti/retriever.rb
module Neeti
  class Retriever
    MINIMUM_RESULTS = 3
    DEFAULT_LIMIT   = 5

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

    def initialize(llm_classifier:, limit: DEFAULT_LIMIT)
      @llm   = llm_classifier
      @limit = limit
    end

    # @param query [String]
    # @return [Array<Sutra>]
    def retrieve(query)
      results = layer2_fts(query)
      return finalize(results) if sufficient?(results)

      results = (results + layer1_metadata(query)).uniq
      return finalize(results) if sufficient?(results)

      results = (results + layer3_llm(query)).uniq
      return finalize(results) if sufficient?(results)

      results = (results + layer4_graph(results)).uniq
      finalize(results)
    end

    private

    def layer1_metadata(query)
      # Expand query with synonyms
      expanded_keywords = expand_keywords(query)
      return [] if expanded_keywords.empty?

      # Build OR tsquery from expanded keywords
      or_tsquery = expanded_keywords.map { |k| "plainto_tsquery('english', #{ActiveRecord::Base.connection.quote(k)})" }.join(" || ")

      # Search across all concept categories using join tables
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

      # Use join table for theme matching
      sutra_ids = SutraTheme.where(theme_id: Theme.where(name: themes).select(:id))
                    .distinct
                    .pluck(:sutra_id)
      Sutra.where(id: sutra_ids).limit(@limit * 2).to_a
    end

    def layer4_graph(existing)
      seed_themes = existing.flat_map { |s| s.themes.map(&:name) }.uniq
      return [] if seed_themes.empty?

      expanded   = Theme.expand_related(seed_themes, depth: 2)
      new_themes = expanded - seed_themes
      return [] if new_themes.empty?

      sutra_ids = SutraTheme.where(theme_id: Theme.where(name: new_themes).select(:id))
                    .where.not(sutra_id: existing.map(&:id))
                    .distinct
                    .pluck(:sutra_id)
      Sutra.where(id: sutra_ids).limit(@limit).to_a
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
  end
end