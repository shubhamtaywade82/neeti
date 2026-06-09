# lib/neeti/evaluator.rb
module Neeti
  class Evaluator
    BENCHMARK_PATH = Rails.root.join('db/eval/benchmark_queries.json')

    Result = Struct.new(:id, :query, :expected_themes, :retrieved_themes,
                        :sutras_found, :theme_hits, :recall, keyword_init: true)

    def self.run(limit: nil)
      queries  = JSON.parse(File.read(BENCHMARK_PATH))
      queries  = queries.first(limit) if limit
      retriever = Retriever.new(llm_classifier: NullClassifier.new)

      results = queries.map do |q|
        sutras   = retriever.retrieve(q['query'])
        ret_themes = sutras.flat_map(&:themes).map(&:downcase).uniq
        expected   = q['expected_themes'].map(&:downcase)
        hits       = (expected & ret_themes).size
        recall     = expected.empty? ? 1.0 : hits.to_f / expected.size

        Result.new(
          id:               q['id'],
          query:            q['query'],
          expected_themes:  expected,
          retrieved_themes: ret_themes,
          sutras_found:     sutras.size,
          theme_hits:       hits,
          recall:           recall.round(2)
        )
      end

      summarize(results)
    end

    def self.summarize(results)
      avg_recall     = (results.sum(&:recall) / results.size).round(3)
      recall_at_1    = results.count { |r| r.recall >= 0.33 }.to_f / results.size
      recall_at_full = results.count { |r| r.recall >= 1.0  }.to_f / results.size
      zero_results   = results.count { |r| r.sutras_found.zero? }

      {
        total_queries:   results.size,
        avg_recall:      avg_recall,
        recall_above_33: recall_at_1.round(2),
        full_recall:     recall_at_full.round(2),
        zero_result_queries: zero_results,
        worst: results.min_by(&:recall).then { |r| { id: r.id, query: r.query, recall: r.recall } },
        best:  results.max_by(&:recall).then { |r| { id: r.id, query: r.query, recall: r.recall } },
        results: results
      }
    end
  end

  # Skips LLM classification during eval (no LLM required for benchmarking retrieval)
  class NullClassifier
    def classify_themes(_query, _known) = []
  end
end
