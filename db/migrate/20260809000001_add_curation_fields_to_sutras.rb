class AddCurationFieldsToSutras < ActiveRecord::Migration[8.0]
  def change
    add_column :sutras, :advisory_status, :integer, null: false, default: 0
    add_column :sutras, :curation_note, :text
    add_column :sutras, :curated_by, :string
    add_column :sutras, :curated_at, :datetime
    
    add_index :sutras, :advisory_status
  end
end
