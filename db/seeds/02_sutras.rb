data = JSON.parse(File.read(Rails.root.join("db/seeds/sutras_data.json")))
data.each do |s|
  Sutra.find_or_create_by!(canonical_id: s["canonical_id"]) do |sutra|
    %w[chapter chapter_title sanskrit transliteration translation_en translation_hi
       themes virtues vices situations emotions source_url].each do |field|
      sutra.send(:"#{field}=", s[field]) if s[field]
    end
  end
end
puts "Seeded #{Sutra.count} sutras"
