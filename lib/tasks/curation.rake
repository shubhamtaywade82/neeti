# lib/tasks/curation.rake
namespace :curation do
  desc "Export pending sutras for review (Pass 1-2 working set)"
  task :export_pending, [:file] => :environment do |_, args|
    file = args[:file] || "pending_sutras_#{Date.today}.csv"
    pending = Sutra.where(advisory_status: :pending).order(:chapter, :verse_number)
    
    CSV.open(file, "w") do |csv|
      csv << %w[id chapter verse canonical_reference sanskrit translation_en
                current_keywords current_themes advisory_status curation_note
                curated_by curated_at]
      
      pending.each do |s|
        csv << [
          s.id,
          s.chapter,
          s.verse_number,
          s.canonical_reference,
          s.sanskrit,
          s.translation_en,
          (s.keywords || []).join("; "),
          (s.themes || []).map { |t| "#{t['theme_id']}:#{t['weight']}" }.join("; "),
          s.advisory_status,
          s.curation_note,
          s.curated_by,
          s.curated_at&.iso8601
        ]
      end
    end
    
    puts "Exported #{pending.count} pending sutras to #{file}"
  end

  desc "Import reviewed decisions from CSV"
  task :import_reviewed, [:file] => :environment do |_, args|
    file = args[:file]
    raise "Please specify a file: rake curation:import_reviewed[filename.csv]" unless file
    
    CSV.foreach(file, headers: true) do |row|
      sutra = Sutra.find(row["id"])
      
      # Parse themes back to hash format
      themes = if row["current_themes"].present?
        row["current_themes"].split("; ").map do |t|
          theme_id, weight = t.split(":")
          { "theme_id" => theme_id.to_i, "weight" => weight.to_f }
        end
      else
        []
      end
      
      sutra.update!(
        keywords: row["current_keywords"].to_s.split("; ").compact_blank,
        themes: themes,
        advisory_status: row["advisory_status"],
        curation_note: row["curation_note"],
        curated_by: row["curated_by"],
        curated_at: row["curated_at"].present? ? Time.parse(row["curated_at"]) : Time.current
      )
    end
    
    puts "Import complete"
  end

  desc "Validate completeness of curation"
  task :validate_completeness => :environment do
    total = Sutra.count
    pending = Sutra.where(advisory_status: :pending).count
    active = Sutra.where(advisory_status: :active).count
    contextual = Sutra.where(advisory_status: :contextual).count
    excluded = Sutra.where(advisory_status: :excluded).count
    
    puts "Total sutras: #{total}"
    puts "Pending: #{pending}"
    puts "Active: #{active}"
    puts "Contextual: #{contextual}"
    puts "Excluded: #{excluded}"
    
    if pending > 0
      puts "\n⚠️  WARNING: #{pending} sutras still pending review"
      exit 1
    else
      puts "\n✅ All sutras have been reviewed"
    end
    
    # Check for missing curator info on non-pending
    missing_curator = Sutra.where.not(advisory_status: :pending)
                           .where(curated_by: nil).or(
                             Sutra.where.not(advisory_status: :pending)
                                  .where(curated_at: nil)
                           ).count
    
    if missing_curator > 0
      puts "⚠️  WARNING: #{missing_curator} non-pending sutras missing curator info"
      exit 1
    else
      puts "✅ All non-pending sutras have curator attribution"
    end
  end

  desc "Show curation statistics"
  task :stats => :environment do
    total = Sutra.count
    status_counts = Sutra.group(:advisory_status).count
    
    puts "=== Curation Statistics ==="
    puts "Total sutras: #{total}"
    puts ""
    puts "By advisory status:"
    status_counts.each do |status, count|
      pct = (count.to_f / total * 100).round(1)
      puts "  #{status}: #{count} (#{pct}%)"
    end
    
    # Keywords stats
    sutras_with_keywords = Sutra.where.not(keywords: nil).where("keywords != ?", [])
    avg_keywords = sutras_with_keywords.average("jsonb_array_length(keywords)")
    puts ""
    puts "Keywords:"
    puts "  Sutras with keywords: #{sutras_with_keywords.count}"
    puts "  Average keywords per sutra: #{avg_keywords&.round(2) || 0}"
    
    # Themes stats
    sutras_with_themes = Sutra.where.not(themes: nil).where("themes != ?", [])
    avg_themes = sutras_with_themes.average("jsonb_array_length(themes)")
    puts ""
    puts "Themes:"
    puts "  Sutras with themes: #{sutras_with_themes.count}"
    puts "  Average themes per sutra: #{avg_themes&.round(2) || 0}"
  end
end
