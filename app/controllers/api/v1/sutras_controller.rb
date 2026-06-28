# frozen_string_literal: true

module Api
  module V1
    class SutrasController < ApplicationController
      def index
        sutras = Sutra.all
        if params[:search].present?
          sutras = sutras.full_text_search(params[:search])
        end
        if params[:theme].present? && params[:theme] != 'all'
          # Fallback if by_theme scope fails or on legacy columns
          begin
            sutras = sutras.by_theme(params[:theme])
          rescue
            sutras = sutras.where("? = ANY(themes)", params[:theme])
          end
        end

        # Map to format expected by frontend SutrasPage
        rendered = sutras.map do |s|
          # Determine pack name from canonical_id format (e.g. 'chanakya' or 'gita')
          pack = s.canonical_id.include?(':') ? s.canonical_id.split(':').first : 'chanakya'
          sutra_number = s.canonical_id.include?('.') ? s.canonical_id.split('.').last.to_i : s.id

          {
            id: s.id,
            pack: pack,
            chapter: s.chapter,
            sutra: sutra_number,
            devanagari: s.sanskrit || s.transliteration || "",
            translation: s.translation_en,
            themes: s.themes || [],
            concepts: s.virtues || []
          }
        end

        render json: rendered
      end
    end
  end
end
