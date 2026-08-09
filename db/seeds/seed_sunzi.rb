require 'json'

sunzi_pack = KnowledgePack.find_by!(slug: 'sunzi')

verses = JSON.parse(File.read(Rails.root.join('db/seeds/sunzi_art_of_war.json')))

verses.each_with_index do |v, i|
  Sutra.find_or_create_by!(
    canonical_id: "sunzi-#{v['chapter']}-#{v['passage']}",
    knowledge_pack: sunzi_pack
  ) do |s|
    s.chapter = v['chapter']
    s.translation_en = v['text']
    s.translation_hi = v['text']
    s.transliteration = ''
    s.sanskrit = ''
    s.themes = [ v['theme'] ]
    s.chapter_title = "Chapter #{v['chapter']}"
    s.source_url = ''
  end
end

puts "Seeded #{verses.size} Art of War passages"
