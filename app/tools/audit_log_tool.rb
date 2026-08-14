# app/tools/audit_log_tool.rb
class AuditLogTool < RubyLLM::Tool
  description "Retrieves audit logs for compliance verification and historical analysis."

  params do
    string :user_id, description: "The ID of the user whose actions to retrieve."
    string :action_type, description: "Filter by action type (e.g., 'create', 'update', 'delete')."
    integer :limit, description: "Maximum number of log entries to retrieve.", default: 10
  end

  def execute(user_id: nil, action_type: nil, limit: 10)
    logs = ToolCall.all
    logs = logs.joins(:chat).where(chats: { user_id: user_id }) if user_id
    logs = logs.where(tool_name: action_type) if action_type
    logs = logs.order(created_at: :desc).limit(limit)

    logs.map { |log| { id: log.id, tool_name: log.tool_name, success: log.success, timestamp: log.created_at } }
  rescue => e
    { error: "Audit log retrieval failed: #{e.message}" }
  end
end
