data = JSON.parse(File.read(Rails.root.join("db/seeds/themes_data.json")))
data.each do |t|
  Theme.find_or_create_by!(name: t["name"]) do |theme|
    theme.category            = t["category"]
    theme.related_theme_names = t["related_theme_names"]
  end
end
puts "Seeded #{Theme.count} themes"
