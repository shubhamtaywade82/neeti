# frozen_string_literal: true

require 'ollama/client'

module Neeti
  module Providers
    class Ollama < Base
      DEFAULT_MODEL = "qwen3.5:4b"

      def initialize(model: nil)
        @model = model || ENV.fetch('OLLAMA_MODEL', DEFAULT_MODEL)
        config = ::Ollama::Config.new
        config.base_url = ENV.fetch('OLLAMA_URL', 'http://localhost:11434')
        config.model    = @model
        config.timeout  = 120
        @client = ::Ollama::Client.new(config: config)
      end

      def name = :ollama

      def chat(messages:, stream: false)
        if stream.respond_to?(:call)
          # When a stream proc is provided, use streaming mode.
          # In tests, WebMock returns non-streaming body; on_token won't fire for real chunks,
          # so we fall back to returning the full content via the non-stream path and pipe it.
          _streaming_chat(messages: messages, stream: stream)
        else
          _plain_chat(messages: messages)
        end
      rescue => e
        raise "Ollama error: #{e.message}"
      end

      private

      def _plain_chat(messages:)
        response = @client.chat(messages: messages)
        response.message&.content || ""
      end

      def _streaming_chat(messages:, stream:)
        buffer = +""
        @client.chat(
          messages: messages,
          hooks: {
            on_token: lambda { |token|
              buffer << token
              stream.call(token)
            }
          }
        )
        # If buffer is empty (e.g. WebMock non-streaming stub), fall back to full response
        if buffer.empty?
          response = @client.chat(messages: messages)
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
