# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Neeti::Providers::Anthropic do
  subject(:provider) { described_class.new }

  describe "#chat" do
    let(:api_response) do
      {
        "id" => "msg_01abc",
        "type" => "message",
        "role" => "assistant",
        "content" => [{ "type" => "text", "text" => "Virtue is its own reward." }],
        "model" => "claude-3-5-sonnet-20241022",
        "stop_reason" => "end_turn",
        "usage" => { "input_tokens" => 10, "output_tokens" => 6 }
      }
    end

    before do
      stub_request(:post, %r{api\.anthropic\.com.*messages})
        .to_return(
          status: 200,
          body: api_response.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )
    end

    it "returns the text content as a string" do
      result = provider.chat(messages: [{ role: "user", content: "Hello" }])
      expect(result).to include("Virtue")
    end

    it "returns a String" do
      result = provider.chat(messages: [{ role: "user", content: "Hello" }])
      expect(result).to be_a(String)
    end

    it "calls stream proc with the full response when stream is provided" do
      received = []
      provider.chat(
        messages: [{ role: "user", content: "Hello" }],
        stream: ->(token) { received << token }
      )
      expect(received).not_to be_empty
    end
  end

  describe "#name" do
    it "returns :anthropic" do
      expect(provider.name).to eq(:anthropic)
    end
  end
end
