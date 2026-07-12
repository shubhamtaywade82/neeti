class CreateKnowledgePacks < ActiveRecord::Migration[8.1]
  def change
    create_table :knowledge_packs do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.text :description
      t.string :icon
      t.string :color
      t.string :author
      t.string :version
      t.string :tier, default: 'free'
      t.boolean :official, default: false
      t.boolean :premium, default: false
      t.integer :node_count, default: 0
      t.integer :edge_count, default: 0
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :knowledge_packs, :slug, unique: true
  end
end
