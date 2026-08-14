class Message < ApplicationRecord
  belongs_to :conversation, optional: true
  belongs_to :chat, optional: true
  has_many :tool_calls, dependent: :destroy

  validates :role,    presence: true, inclusion: { in: %w[user assistant] }
  validates :content, presence: true

  # Ruby LLM integration - thinking and cost tracking

  # Cost calculation helper
  def total_tokens
    (input_tokens || 0) + (output_tokens || 0) + (thinking_tokens || 0)
  end
end
