# app/models/chat.rb
class Chat < ApplicationRecord
  belongs_to :user
  has_many :messages, dependent: :destroy
  has_many :tool_calls, dependent: :destroy

  # Serialize metadata as JSON
  serialize :metadata, coder: JSON

  # Validations
  validates :agent_type, presence: true

  # Scopes
  scope :by_agent_type, ->(type) { where(agent_type: type) }
  scope :recent, -> { order(created_at: :desc) }

  # Cost tracking
  def update_cost!
    total = messages.sum(&:total_cost) || 0.0
    update(total_cost: total)
  end

  # Message count cache
  def increment_message_count!
    increment!(:message_count)
  end
end
