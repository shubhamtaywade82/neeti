class Consultation < ApplicationRecord
  belongs_to :user
  belongs_to :conversation
  
  has_many :citations, dependent: :destroy
  has_many :retrieval_candidates, dependent: :destroy
  has_many :credit_ledger_entries, dependent: :destroy
  has_many :safety_events, dependent: :destroy
  
  has_many :sutras, through: :citations
  
  before_create :generate_permalink_token
  
  enum status: { pending: 0, completed: 1, archived: 2 }
  
  scope :recent, -> { order(created_at: :desc) }
  scope :completed, -> { where(status: :completed) }
  
  # Cost in credits (default 1 per consultation)
  def credit_cost
    super || 1
  end
  
  # Generate unique token for shareable permalink
  def generate_permalink_token
    self.permalink_token = SecureRandom.urlsafe_base64(12)
  end
  
  # Shareable URL for this consultation
  def shareable_url
    Rails.application.routes.url_helpers.consultation_url(self, token: permalink_token)
  rescue
    "/consultations/#{id}"
  end
  
  # Record citations after advice is generated
  def record_citations!(sutra_ids)
    sutra_ids.each_with_index do |sutra_id, idx|
      citations.find_or_create_by!(
        sutra_id: sutra_id,
        position: idx
      )
    end
  end
  
  # Log retrieval candidates for auditing/evaluation
  def log_retrieval!(channel:, sutra: nil, document_chunk: nil, rank:, score:)
    retrieval_candidates.create!(
      channel: channel,
      sutra: sutra,
      document_chunk: document_chunk,
      rank_position: rank,
      rrf_score: score
    )
  end
end
