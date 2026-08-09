class CreateDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :documents do |t|
      t.references :user, null: false, foreign_key: true
      t.references :collection, null: true, foreign_key: true
      t.string :filename, null: false
      t.string :title
      t.string :file_type, null: false
      t.bigint :file_size, default: 0
      t.string :storage_key
      t.integer :page_count, default: 0
      t.integer :chunk_count, default: 0
      t.integer :token_count, default: 0
      t.string :status, default: 'pending'
      t.text :error_message
      t.jsonb :metadata, default: {}
      t.timestamps
    end
    add_index :documents, [ :user_id, :status ]
  end
end
