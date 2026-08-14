class SafetyEvent < ApplicationRecord
  belongs_to :user

  validates :category, presence: true
  validates :detection_stage, presence: true
  validates :occurred_at, presence: true

  scope :recent, -> { order(occurred_at: :desc) }
end
