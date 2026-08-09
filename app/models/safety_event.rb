class SafetyEvent < ApplicationRecord
  belongs_to :user
  belongs_to :consultation, optional: true
  
  validates :event_type, presence: true
  
  enum event_type: { 
    crisis_detected: 0, 
    hallucination_blocked: 1, 
    excluded_sutra_attempted: 2 
  }
  
  scope :crisis, -> { where(event_type: :crisis_detected) }
  scope :hallucinations, -> { where(event_type: :hallucination_blocked) }
end
