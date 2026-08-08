# app/agents/policy_drafting_agent.rb
class PolicyDraftingAgent < RubyLLM::Agent
  chat_model Chat

  model 'gpt-oss:120b', provider: :ollama

  schema PolicyUpdateSchema

  instructions do
    "You are an expert policy drafter for Neeti. Your task is to update compliance policies based on user requests. Always return structured output matching the PolicyUpdateSchema."
  end
end
