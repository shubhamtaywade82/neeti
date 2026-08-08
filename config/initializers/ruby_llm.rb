# config/initializers/ruby_llm.rb
RubyLLM.configure do |config|
  # Connect to Ollama Cloud (Hosted Ollama)
  config.ollama_api_base = 'https://ollama.com/v1'
  config.ollama_api_key = Rails.application.credentials.dig(:ollama, :api_key)

  # Set defaults for your platform
  config.default_model = 'gpt-oss:120b' # Excellent general model on Ollama Cloud
  config.default_embedding_model = 'mxbai-embed-large'
  
  # Production Safety & Tracking
  config.track_usage = true # Enables the internal cost and usage ledger
  
  # Concurrent Tool Execution
  config.tool_concurrency = :fibers
end
