class UserInsight < ApplicationRecord
  belongs_to :user
  validates :content, presence: true
  validates :insight_type, inclusion: { in: %w[goal challenge preference pattern value] }, allow_nil: true
end
