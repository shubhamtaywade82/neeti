# frozen_string_literal: true

require 'anthropic'

module Neeti
  module Providers
    class Anthropic < Base
      DEFAULT_MODEL = "claude-3-5-sonnet-20241022"
      MAX_TOKENS    = 2048

      def initialize(model: nil)
        @model  = model || ENV.fetch('ANTHROPIC_MODEL', DEFAULT_MODEL)
        @client = ::Anthropic::Client.new(
          api_key: ENV.fetch('ANTHROPIC_API_KEY', 'placeholder')
        )
      end

      def name = :anthropic

      # Anthropic streaming delivers the full response back via the same return value.
      # We implement a simplified approach: fetch the response and
      # optionally pipe it through the stream proc as a single token.
      # This matches the production use-case where Anthropic is a fallback provider.
      def chat(messages:, stream: false)
        system_msg = messages.find { |m| m[:role].to_s == "system" }&.then { |m| m[:content] }.to_s
        other_msgs = messages.reject { |m| m[:role].to_s == "system" }

        params = {
          model:      @model,
          max_tokens: MAX_TOKENS,
          messages:   other_msgs
        }
        params[:system] = system_msg unless system_msg.empty?

        response = if @client.respond_to?(:messages) && @client.messages.respond_to?(:create)
                     @client.messages.create(params)
                   else
                     @client.messages(parameters: params)
                   end

        text = if response.respond_to?(:content) && response.content.is_a?(Array)
                 first = response.content.first
                 first&.respond_to?(:text) ? first.text : first&.dig("text")
               elsif response.is_a?(Hash)
                 response.dig("content", 0, "text") || response.dig(:content, 0, :text)
               else
                 response.to_s
               end || ""

        stream.call(text) if stream.respond_to?(:call) && !text.empty?
        text
      rescue => e
        raise "Anthropic error: #{e.message}"
      end
    end
  end
end
