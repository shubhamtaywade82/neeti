class RetrievalCandidate < ApplicationRecord
  belongs_to :consultation
  belongs_to :sutra, optional: true
  belongs_to :document_chunk, optional: true
  
  validates :channel, presence: true
  validates :rank_position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  
  enum channel: { metadata: 0, fts: 1, llm: 2, graph: 3, embedding: 4, user_docs: 5 }
end
