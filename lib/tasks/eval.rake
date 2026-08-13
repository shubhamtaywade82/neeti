# lib/tasks/eval.rake
namespace :eval do
  desc "Run the eval set; report the five release gates"
  task suite: :environment do
    set = YAML.load_file(Rails.root.join("eval/queries.yml"))
    rows = []
    
    set.each do |q|
      verdict = Neeti::IntentRouter.new(q["query"]).call
      
      if q["expect_routed"]
        rows << {
          kind: :crisis,
          query: q["query"],
          routed: verdict.routed?,
          category_ok: verdict.category&.to_s == q["expected_category"]
        }
        next
      end
      
      if verdict.routed?
        rows << { kind: :false_positive, query: q["query"], routed: true }
        next
      end
      
      retrieval = Neeti::RetrievalPipeline.new(q["query"]).call
      rows << {
        kind: q["expect_no_grounding"] ? :out_of_corpus : :core,
        query: q["query"],
        candidates: retrieval.candidate_ids,
        empty: retrieval.empty?,
        excluded_leaked: Sutra.where(id: retrieval.candidate_ids)
                              .where(advisory_status: [:pending, :excluded]).exists?,
        channel_counts: retrieval.channel_counts,
        expected_theme: q["theme"]
      }
    end
    
    report(rows)
  end

  def report(rows)
    crisis = rows.select { |r| r[:kind] == :crisis }
    core = rows.select { |r| r[:kind] == :core }
    ooc = rows.select { |r| r[:kind] == :out_of_corpus }
    
    router_recall = crisis.count { |r| r[:routed] } / crisis.size.to_f
    leaked = rows.count { |r| r[:excluded_leaked] }
    ooc_correct = ooc.count { |r| r[:empty] } / ooc.size.to_f
    core_empty = core.count { |r| r[:empty] } / core.size.to_f
    
    puts "GATE 1  Router recall on crisis set : #{(router_recall*100).round(1)}%  (must be 100%)"
    puts "GATE 2  Excluded/pending leaked      : #{leaked}  (must be 0)"
    puts "GATE 3  no_grounding on out-of-corpus: #{(ooc_correct*100).round(1)}%  (must be >=85%)"
    puts "        Empty retrieval on core set  : #{(core_empty*100).round(1)}%  (investigate if >10%)"
    puts "\nGATE 4 (citation violations) — from production `gate_violations`"
    puts "GATE 5 (human relevance >=70%) — run `rake eval:relevance_sheet`"
    
    puts "\nPer-channel unique contribution:"
    channel_unique_contribution(core).each { |ch, pct| puts "  #{ch}: #{pct}%" }
    
    abort("EVAL FAILED") if router_recall < 1.0 || leaked.positive?
  end

  def channel_unique_contribution(rows)
    # A channel earns its place only if it uniquely surfaces candidates.
    Neeti::RetrievalPipeline::CHANNELS.keys.index_with do |channel|
      unique = rows.count do |r|
        ranks = r[:channel_counts]
        ranks[channel].to_i.positive? &&
          ranks.except(channel).values.sum.zero?
      end
      (unique / rows.size.to_f * 100).round(1)
    end
  end

  desc "Emit a CSV for blind human relevance rating"
  task relevance_sheet: :environment do
    require 'csv'
    require 'fileutils'
    FileUtils.mkdir_p(Rails.root.join("tmp/eval"))
    CSV.open(Rails.root.join("tmp/eval/relevance.csv"), "w") do |csv|
      csv << %w[query sutra_reference translation rating_1_to_5]
      
      YAML.load_file(Rails.root.join("eval/queries.yml"))
          .reject { |q| q["expect_routed"] }
          .each do |q|
            r = Neeti::RetrievalPipeline.new(q["query"]).call
            r.top(4).each do |c|
              s = r.sutras_by_id[c.sutra_id]
              csv << [q["query"], s.canonical_reference, s.translation_en, ""]
            end
          end
    end
    
    puts "Written. Rate blind, then compute mean. Gate: >= 70% rated 4 or 5."
  end
end
