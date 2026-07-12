require 'json'

stoic_pack = KnowledgePack.find_by!(slug: 'stoic')

verses = JSON.parse(File.read(Rails.root.join('db/seeds/stoic_meditations.json')))

verses.each_with_index do |v, i|
  Sutra.find_or_create_by!(
    canonical_id: "stoic-#{v['book']}-#{v['passage']}",
    knowledge_pack: stoic_pack
  ) do |s|
    s.chapter = v['book']
    s.translation_en = v['text']
    s.translation_hi = v['text']
    s.transliteration = ''
    s.sanskrit = ''
    s.themes = [v['theme']]
    s.chapter_title = "Book #{v['book']}"
    s.source_url = ''
  end
end

puts "Seeded #{verses.size} Stoic Meditations passages"
