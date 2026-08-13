# config/initializers/ruby_llm.rb
RubyLLM.configure do |config|
  # Connect to Ollama Cloud (Hosted Ollama)
  config.ollama_api_base = 'https://ollama.com/v1' if config.respond_to?(:ollama_api_base=)
  config.ollama_api_key = Rails.application.credentials.dig(:ollama, :api_key) if config.respond_to?(:ollama_api_key=)

  # Set defaults for your platform
  config.default_model = 'gpt-oss:120b' if config.respond_to?(:default_model=)
  config.default_embedding_model = 'mxbai-embed-large' if config.respond_to?(:default_embedding_model=)

  # Use modern acts_as API
  config.use_new_acts_as = true if config.respond_to?(:use_new_acts_as=)

  # Production Safety & Tracking
  config.track_usage = true if config.respond_to?(:track_usage=)

  # Concurrent Tool Execution
  config.tool_concurrency = :fibers if config.respond_to?(:tool_concurrency=)
end
