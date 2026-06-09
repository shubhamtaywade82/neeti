# lib/tasks/neeti.rake
namespace :neeti do
  desc "Run retrieval quality benchmark (optional LIMIT=N for subset)"
  task evaluate: :environment do
    limit = ENV['LIMIT']&.to_i
    puts "Running Neeti retrieval benchmark#{" (first #{limit})" if limit}...\n\n"

    report = Neeti::Evaluator.run(limit: limit)

    puts "=" * 60
    puts "RETRIEVAL QUALITY REPORT"
    puts "=" * 60
    puts "Total queries:       #{report[:total_queries]}"
    puts "Avg theme recall:    #{(report[:avg_recall] * 100).round(1)}%"
    puts "Recall >= 33%:       #{(report[:recall_above_33] * 100).round(1)}%"
    puts "Full recall:         #{(report[:full_recall] * 100).round(1)}%"
    puts "Zero-result queries: #{report[:zero_result_queries]}"
    puts "-" * 60
    puts "Best:  [#{report[:best][:id]}] #{report[:best][:query].truncate(50)} (#{(report[:best][:recall] * 100).round}%)"
    puts "Worst: [#{report[:worst][:id]}] #{report[:worst][:query].truncate(50)} (#{(report[:worst][:recall] * 100).round}%)"
    puts "=" * 60

    if ENV['VERBOSE']
      puts "\nPer-query breakdown:"
      report[:results].sort_by(&:recall).each do |r|
        status = r.recall >= 1.0 ? "+" : r.recall > 0 ? "~" : "x"
        puts "  #{status} [#{r.id.to_s.rjust(2)}] #{r.query.truncate(45).ljust(45)} recall=#{(r.recall*100).round}% found=#{r.sutras_found}"
      end
    end

    exit(1) if report[:avg_recall] < 0.2  # fail CI if quality drops below 20%
  end
end
