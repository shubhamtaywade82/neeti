class CreateJoinTablesAndThemeRelationships < ActiveRecord::Migration[8.1]
  def change
    # ------------------------------------------------------------------
    # Join tables: sutra ↔ theme (for themes, virtues, vices, situations, emotions)
    # ------------------------------------------------------------------

    create_join_table :sutras, :themes, table_name: :sutra_themes do |t|
      t.index [:sutra_id, :theme_id], unique: true
      t.index [:theme_id]
    end

    create_join_table :sutras, :themes, table_name: :sutra_virtues do |t|
      t.index [:sutra_id, :theme_id], unique: true
      t.index [:theme_id]
    end

    create_join_table :sutras, :themes, table_name: :sutra_vices do |t|
      t.index [:sutra_id, :theme_id], unique: true
      t.index [:theme_id]
    end

    create_join_table :sutras, :themes, table_name: :sutra_situations do |t|
      t.index [:sutra_id, :theme_id], unique: true
      t.index [:theme_id]
    end

    create_join_table :sutras, :themes, table_name: :sutra_emotions do |t|
      t.index [:sutra_id, :theme_id], unique: true
      t.index [:theme_id]
    end

    # ------------------------------------------------------------------
    # Theme relationships (directed graph edges)
    # ------------------------------------------------------------------

    create_table :theme_relationships do |t|
      t.references :source_theme, null: false, foreign_key: { to_table: :themes }, index: false
      t.references :target_theme, null: false, foreign_key: { to_table: :themes }, index: false
      t.string :relationship_type, null: false, default: "related"
      t.float  :weight, default: 1.0
      t.timestamps
    end

    add_index :theme_relationships, [:source_theme_id, :target_theme_id, :relationship_type], unique: true, name: "idx_theme_relationships_unique"
    add_index :theme_relationships, :source_theme_id
    add_index :theme_relationships, :target_theme_id
    add_index :theme_relationships, :relationship_type
  end
end
