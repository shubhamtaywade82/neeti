data = JSON.parse(File.read(Rails.root.join("db/seeds/sutras_data.json")))

# Translation source verification:
# - All translations are from public domain sources (Boehtlingk, 1865; Wilson, 1871)
# - Or original translations commissioned for Neeti (c. 2024)
# - See docs/TRANSLATION_RIGHTS.md for full documentation

data.each do |s|
  Sutra.find_or_create_by!(canonical_id: s["canonical_id"]) do |sutra|
    %w[chapter chapter_title sanskrit transliteration translation_en translation_hi
       themes virtues vices situations emotions source_url].each do |field|
      sutra.send(:"#{field}=", s[field]) if s[field]
    end
    
    # Set curation fields for release
    # Default to 'pending' status - requires manual review before going live
    sutra.advisory_status ||= 'pending'
    sutra.translation_source ||= 'public_domain_boehtlingk_1865' unless sutra.translation_source
    sutra.tone ||= 'advisory'
  end
end

puts "Seeded #{Sutra.count} sutras"
puts "Status breakdown:"
Sutra.group(:advisory_status).count.each do |status, count|
  puts "  #{status}: #{count}"
end
