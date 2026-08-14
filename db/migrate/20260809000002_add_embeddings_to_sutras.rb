class AddEmbeddingsToSutras < ActiveRecord::Migration[8.0]
  def change
    enable_extension "vector" unless extension_enabled?("vector")

    add_column :sutras, :embedding, :vector, limit: 768
    add_column :sutras, :embedding_model, :string
    add_column :sutras, :embedding_source_digest, :string
    add_column :sutras, :embedded_at, :datetime

    # DELIBERATELY NO INDEX.
    # 455 rows × 768 dims ≈ 1.4 MB. Sequential scan with SIMD-accelerated
    # distance is ~0.3 ms. ivfflat/hnsw add build cost, recall loss, and
    # maintenance for a query that is already faster than the network hop.
    # Revisit only above ~50,000 rows.
  end
end
