# frozen_string_literal: true

module Neeti
  class ModelRouter
    def self.for(_task = :advice)
      if Rails.env.production? && ENV['ANTHROPIC_API_KEY'].present?
        Providers::Anthropic.new
      else
        Providers::Ollama.new
      end
    rescue => e
      Rails.logger.warn("ModelRouter: primary provider failed (#{e.message}), falling back")
      fallback
    end

    def self.fallback
      if ENV['ANTHROPIC_API_KEY'].present?
        Providers::Anthropic.new
      else
        Providers::NullProvider.new(response: "Service temporarily unavailable.")
      end
    end
  end
end
