class AddEmbeddingsToSutras < ActiveRecord::Migration[8.0]
  def change
    enable_extension "vector" unless extension_enabled?("vector")
    
    add_column :sutras, :embedding, :vector, limit: 768
    add_column :sutras, :embedding_model, :string
    add_column :sutras, :embedding_source_digest, :string
    
    add_index :sutras, :embedding, using: :ivfflat, opclass: :vector_cosine_ops
    add_index :sutras, :embedding_model
  end
end
