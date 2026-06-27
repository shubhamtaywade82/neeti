class NormalizeJoinTableConstraints < ActiveRecord::Migration[8.1]
  TABLES = %w[sutra_themes sutra_virtues sutra_vices sutra_situations sutra_emotions].freeze

  def change
    TABLES.each do |table|
      add_foreign_key table, :sutras, column: :sutra_id, on_delete: :cascade unless foreign_key_exists?(table, :sutras, column: :sutra_id)
      add_foreign_key table, :themes, column: :theme_id, on_delete: :cascade unless foreign_key_exists?(table, :themes, column: :theme_id)
      add_index table, [:sutra_id] unless index_exists?(table, [:sutra_id])
      add_index table, [:theme_id] unless index_exists?(table, [:theme_id])
    end
  end
end
