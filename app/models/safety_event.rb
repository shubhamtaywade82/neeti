class SafetyEvent < ApplicationRecord
  belongs_to :user

  validates :category, presence: true, inclusion: { in: Neeti::IntentRouter::CATEGORIES.map(&:to_s) }
  validates :detection_stage, presence: true, inclusion: { in: %w[lexical classifier] }
  validates :occurred_at, presence: true

  scope :crisis, -> { where(category: "self_harm") }
  scope :recent, -> { where("occurred_at > ?", 24.hours.ago) }
end
