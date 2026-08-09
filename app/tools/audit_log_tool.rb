# app/tools/audit_log_tool.rb
class AuditLogTool < RubyLLM::Tool
  description "Retrieves audit logs for compliance verification and historical analysis."

  params do
    string :user_id, description: "The ID of the user whose actions to retrieve."
    string :action_type, description: "Filter by action type (e.g., 'create', 'update', 'delete')."
    integer :limit, description: "Maximum number of log entries to retrieve.", default: 10
  end

  def execute(user_id: nil, action_type: nil, limit: 10)
    logs = AuditLog.all
    logs = logs.where(user_id: user_id) if user_id
    logs = logs.where(action_type: action_type) if action_type
    logs = logs.limit(limit)

    logs.map { |log| { id: log.id, user_id: log.user_id, action: log.action_type, timestamp: log.created_at, details: log.details } }
  rescue => e
    { error: "Audit log retrieval failed: #{e.message}" }
  end
end
