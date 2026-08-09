# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Neeti::LlmClassifier do
  let(:provider) { instance_double(Neeti::Providers::NullProvider) }
  subject(:classifier) { described_class.new(provider: provider) }

  describe "#classify_themes" do
    it "returns known themes from LLM JSON response" do
      allow(provider).to receive(:chat).and_return('["greed", "desire"]')
      result = classifier.classify_themes("I am obsessed with money", %w[greed desire loyalty])
      expect(result).to match_array(%w[greed desire])
    end

    it "returns [] on invalid JSON from LLM" do
      allow(provider).to receive(:chat).and_return("not valid json")
      result = classifier.classify_themes("test", %w[greed])
      expect(result).to eq([])
    end

    it "filters out themes not in known_themes list" do
      allow(provider).to receive(:chat).and_return('["greed", "unknown_theme"]')
      result = classifier.classify_themes("test", %w[greed desire])
      expect(result).to eq([ "greed" ])
    end

    it "returns [] when LLM returns empty array" do
      allow(provider).to receive(:chat).and_return("[]")
      result = classifier.classify_themes("test", %w[greed])
      expect(result).to eq([])
    end

    it "handles JSON embedded in other text" do
      allow(provider).to receive(:chat).and_return('Here are themes: ["greed"] — enjoy!')
      result = classifier.classify_themes("test", %w[greed desire])
      expect(result).to eq([ "greed" ])
    end
  end
end
