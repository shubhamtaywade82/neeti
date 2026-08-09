class CreateDocumentChunks < ActiveRecord::Migration[8.1]
  def change
    create_table :document_chunks do |t|
      t.references :document, null: false, foreign_key: true
      t.text :content, null: false
      t.integer :position, null: false
      t.integer :token_count, default: 0
      t.float :embedding, array: true, default: []
      t.timestamps
    end
    add_index :document_chunks, [ :document_id, :position ]
  end
end
