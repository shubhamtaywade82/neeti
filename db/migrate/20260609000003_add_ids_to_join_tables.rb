class AddIdsToJoinTables < ActiveRecord::Migration[8.1]
  TABLES = %w[sutra_themes sutra_virtues sutra_vices sutra_situations sutra_emotions].freeze

  def up
    TABLES.each do |table|
      execute "ALTER TABLE #{table} ADD COLUMN id BIGSERIAL PRIMARY KEY"
    end
  end

  def down
    # Removing a primary key column in PostgreSQL requires special handling.
    # We drop and recreate the tables without the id column,
    # but this assumes data can be repopulated from the array columns.
    TABLES.each do |table|
      execute "ALTER TABLE #{table} DROP COLUMN id"
    end
  end
end
