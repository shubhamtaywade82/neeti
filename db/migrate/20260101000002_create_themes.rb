class CreateThemes < ActiveRecord::Migration[8.1]
  def change
    create_table :themes do |t|
      t.text :name,                null: false
      t.text :category
      t.text :related_theme_names, array: true, default: []
      t.timestamps
    end
    add_index :themes, :name, unique: true
    add_index :themes, :related_theme_names, using: :gin
  end
end
