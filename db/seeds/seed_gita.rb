require 'json'

gita_pack = KnowledgePack.find_by!(slug: 'gita')
chanakya_pack = KnowledgePack.find_by!(slug: 'chanakya')

gita_verses = JSON.parse(File.read(Rails.root.join('db/seeds/gita_verses.json')))

gita_verses.each_with_index do |v, i|
  Sutra.find_or_create_by!(
    canonical_id: "gita-#{v['chapter']}-#{v['verse']}",
    knowledge_pack: gita_pack
  ) do |s|
    s.chapter = v['chapter']
    s.translation_en = v['text']
    s.translation_hi = v['text']
    s.transliteration = ''
    s.sanskrit = ''
    s.themes = [ v['theme'] ]
    s.chapter_title = "Chapter #{v['chapter']}"
    s.source_url = "https://vedabase.io/en/library/bg/#{v['chapter']}/#{v['verse']}/"
  end
end

puts "Seeded #{gita_verses.size} Bhagavad Gita verses"
