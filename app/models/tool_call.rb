# app/models/tool_call.rb
class ToolCall < ApplicationRecord
  belongs_to :chat
  belongs_to :message

  # Serialize JSON columns
  serialize :arguments, coder: JSON
  serialize :result, coder: JSON

  # Validations
  validates :tool_name, presence: true

  # Scopes
  scope :successful, -> { where(success: true) }
  scope :failed, -> { where(success: false) }
  scope :by_tool, ->(name) { where(tool_name: name) }

  # Track execution time
  def record_execution_time(start_time)
    execution_time_ms = ((Time.current - start_time) * 1000).to_i
    update(execution_time_ms: execution_time_ms)
  end
end
