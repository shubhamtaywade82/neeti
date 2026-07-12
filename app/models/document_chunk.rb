class DocumentChunk < ApplicationRecord
  belongs_to :document

  validates :content, presence: true
  validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(position: :asc) }

  def self.similar_to(embedding, limit: 5)
    return none if embedding.blank? || embedding.empty?

    candidates = where.not(embedding: [])
                    .limit(1000)
                    .select(:id, :content, :position, :document_id, :embedding)

    query_vec = embedding.map(&:to_f)
    scored = candidates.map do |chunk|
      chunk_emb = chunk.embedding
      next unless chunk_emb.is_a?(Array) && chunk_emb.length == query_vec.length

      sim = cosine_similarity(query_vec, chunk_emb.map(&:to_f))
      { chunk: chunk, similarity: sim }
    end.compact

    scored.sort_by { |s| -s[:similarity] }.first(limit).map { |s| s[:chunk] }
  end

  def self.cosine_similarity(a, b)
    dot = a.zip(b).sum { |ai, bi| ai * bi }
    norm_a = Math.sqrt(a.sum { |ai| ai * ai })
    norm_b = Math.sqrt(b.sum { |bi| bi * bi })
    return 0.0 if norm_a == 0 || norm_b == 0
    dot / (norm_a * norm_b)
  end
end
