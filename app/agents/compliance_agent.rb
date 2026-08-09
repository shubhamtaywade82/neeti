# app/agents/compliance_agent.rb
class ComplianceAgent < RubyLLM::Agent
  chat_model Chat # Tells ruby_llm to persist conversations to your Chat model

  # Use a reasoning-heavy model via Ollama Cloud
  model "deepseek-r1:14b", provider: :ollama

  # Give the model a larger computation budget to deliberate
  thinking effort: :high, budget: 8000

  instructions do
    prompt("instructions", current_user_name: -> { chat.user.email })
  end

  tools PolicySearchTool, AuditLogTool

  before_tool_call do |tool_call|
    Rails.logger.info("[Neeti Audit] User #{chat.user.id} requested tool: #{tool_call.name}")
    # Example: Limit total tool calls per conversation to prevent runaway costs
    if chat.tool_calls.count > 15
      raise "Tool call limit exceeded to prevent infinite loops."
    end
  end
end
