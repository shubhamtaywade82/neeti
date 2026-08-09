# config/initializers/ruby_llm.rb
RubyLLM.configure do |config|
  # Connect to Ollama Cloud (Hosted Ollama)
  # Note: ruby_llm 1.3.x's Ollama provider sends no auth headers (local-only
  # design); there is no `ollama_api_key` config method to set here.
  config.ollama_api_base = ENV.fetch("OLLAMA_API_BASE", "http://localhost:11434/v1")

  # Set defaults for your platform
  config.default_model = "gpt-oss:120b" # Excellent general model on Ollama Cloud
  config.default_embedding_model = "mxbai-embed-large"

  # anthropic/openai keys, if configured, let ruby_llm route to those
  # providers as well (see lib/neeti/model_router.rb for provider selection).
  config.anthropic_api_key = Rails.application.credentials.dig(:anthropic, :api_key) || ENV["ANTHROPIC_API_KEY"]
  config.openai_api_key = Rails.application.credentials.dig(:openai, :api_key) || ENV["OPENAI_API_KEY"]
end
