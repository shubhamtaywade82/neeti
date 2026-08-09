class AddCurationFieldsToSutras < ActiveRecord::Migration[8.0]
  def up
    add_column :sutras, :advisory_status, :integer, null: false, default: 0
    add_column :sutras, :curation_note, :text
    add_column :sutras, :curated_by, :string
    add_column :sutras, :curated_at, :datetime
    add_column :sutras, :translation_source, :string
    add_column :sutras, :tone, :string
    add_column :sutras, :applicability, :string, array: true, default: []
    add_column :sutras, :corpus_id, :bigint
    
    add_index :sutras, :advisory_status
    add_index :sutras, :applicability, using: :gin
    add_index :sutras, :corpus_id
    
    # CRITICAL: Every existing row lands in `pending` (0) and is therefore NOT retrievable.
    # This is intentional: the product is inert until curation completes.
    execute <<~SQL
      ALTER TABLE sutras ADD CONSTRAINT chk_sutras_advisory_status
        CHECK (advisory_status BETWEEN 0 AND 3);
      
      ALTER TABLE sutras ADD CONSTRAINT chk_sutras_curated_when_decided
        CHECK (
          advisory_status = 0
          OR (curated_by IS NOT NULL AND curated_at IS NOT NULL)
        );
    SQL
  end

  def down
    execute "ALTER TABLE sutras DROP CONSTRAINT IF EXISTS chk_sutras_curated_when_decided"
    execute "ALTER TABLE sutras DROP CONSTRAINT IF EXISTS chk_sutras_advisory_status"
    
    remove_column :sutras, :corpus_id
    remove_column :sutras, :applicability
    remove_column :sutras, :tone
    remove_column :sutras, :translation_source
    remove_column :sutras, :curated_at
    remove_column :sutras, :curated_by
    remove_column :sutras, :curation_note
    remove_column :sutras, :advisory_status
  end
end
