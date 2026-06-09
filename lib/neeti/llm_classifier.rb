# frozen_string_literal: true

module Neeti
  class LlmClassifier
    SYSTEM = <<~PROMPT.freeze
      You are a semantic classifier for Chanakya Neeti themes.
      Given a user query and a list of known theme names, return ONLY a JSON array
      of the most relevant theme names from the provided list (max 5).
      Return [] if none match. Respond with ONLY valid JSON. No explanation.
    PROMPT

    def initialize(provider: nil)
      @provider = provider || ModelRouter.for(:classify)
    end

    # @param query [String] the user query
    # @param known_themes [Array<String>] list of valid theme names
    # @return [Array<String>] matching theme names (subset of known_themes)
    def classify_themes(query, known_themes)
      msgs = [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: "Query: \"#{query}\"\nKnown themes: #{known_themes.to_json}\nReturn matching theme names as JSON array."
        }
      ]
      raw    = @provider.chat(messages: msgs)
      json_str = raw.match(/\[.*\]/m)&.to_s || "[]"
      parsed = JSON.parse(json_str)
      parsed.select { |t| known_themes.include?(t) }
    rescue JSON::ParserError, TypeError
      []
    end
  end
end
