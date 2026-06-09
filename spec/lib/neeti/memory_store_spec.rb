# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Neeti::MemoryStore do
  let(:user) { create(:user) }

  describe ".retrieve_insights" do
    it "returns most recent insights for a user" do
      create(:user_insight, user: user, content: "User wants to improve leadership")
      create(:user_insight, user: user, content: "User struggles with conflict")
      result = Neeti::MemoryStore.retrieve_insights(user)
      expect(result.size).to eq(2)
    end

    it "limits results to 5 by default" do
      6.times { create(:user_insight, user: user) }
      result = Neeti::MemoryStore.retrieve_insights(user)
      expect(result.size).to eq(5)
    end

    it "returns empty array for user with no insights" do
      result = Neeti::MemoryStore.retrieve_insights(user)
      expect(result).to eq([])
    end
  end
end
