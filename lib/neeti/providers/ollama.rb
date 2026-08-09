# frozen_string_literal: true

require "ollama/client"

module Neeti
  module Providers
    class Ollama < Base
      DEFAULT_MODEL = "qwen3.5:4b"

      def initialize(model: nil)
        @model = model || ENV.fetch("OLLAMA_MODEL", DEFAULT_MODEL)
        config = ::Ollama::Config.new
        config.base_url = ENV.fetch("OLLAMA_URL", "http://localhost:11434")
        config.model    = @model
        config.timeout  = 300
        @client = ::Ollama::Client.new(config: config)
      end

      def name = :ollama

      def chat(messages:, stream: false)
        options = { keep_alive: "30m" }
        if stream.respond_to?(:call)
          _streaming_chat(messages: messages, stream: stream, options: options)
        else
          _plain_chat(messages: messages, options: options)
        end
      rescue => e
        raise "Ollama error: #{e.message}"
      end

      private

      def _plain_chat(messages:, options:)
        response = @client.chat(messages: messages, options: options)
        response.message&.content || ""
      end

      def _streaming_chat(messages:, stream:, options:)
        buffer = +""
        @client.chat(
          messages: messages,
          options: options,
          hooks: {
            on_token: lambda { |token|
              buffer << token
              stream.call(token)
            }
          }
        )
        if buffer.empty?
          response = @client.chat(messages: messages, options: options)
          content = response.message&.content || ""
          stream.call(content) unless content.empty?
          content
        else
          buffer
        end
      end
    end
  end
end
