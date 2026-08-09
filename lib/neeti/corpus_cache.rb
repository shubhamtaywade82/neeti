# frozen_string_literal: true

module Neeti
  class CorpusCache
    CACHE_KEY = "neeti:corpus:all_sutras"
    TTL       = 1.hour

    def self.all_sutras
      Rails.cache.fetch(CACHE_KEY, expires_in: TTL) do
        Sutra.order(:chapter, :canonical_id).to_a
      end
    end

    def self.invalidate!
      Rails.cache.delete(CACHE_KEY)
    end

    def self.corpus_text
      all_sutras.map { |s|
        "Sutra #{s.canonical_id} (Ch.#{s.chapter}): #{s.sanskrit.presence || s.transliteration.presence || ''}\n\"#{s.translation_en}\"\nThemes: #{s.themes.join(', ')}"
      }.join("\n\n---\n\n")
    end
  end
end
