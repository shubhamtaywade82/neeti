# frozen_string_literal: true

module Neeti
  class MemoryStore
    def self.retrieve_insights(user, limit: 5)
      user.user_insights.order(created_at: :desc).limit(limit).to_a
    end
  end
end
