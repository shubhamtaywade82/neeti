# app/schemas/policy_update_schema.rb
class PolicyUpdateSchema < RubyLLM::Schema
  string :section_id, description: "The ID of the policy section to update."
  string :revised_text, description: "The new text for the policy section."
  boolean :requires_approval, description: "Whether this change requires managerial approval."
end
