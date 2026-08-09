# frozen_string_literal: true

module Api
  module V1
    class MessagesController < ApplicationController
      def index
        conversation = current_user.conversations.find(params[:conversation_id])
        messages = conversation.messages.order(:created_at).map do |m|
          cited = []
          if m.cited_sutra_ids.present?
            cited = Sutra.where(id: m.cited_sutra_ids).map do |s|
              {
                id: s.canonical_id,
                preview: s.translation_en&.truncate(80),
                sanskrit: s.sanskrit,
                transliteration: s.transliteration,
                translation_en: s.translation_en,
                translation_hi: s.translation_hi,
                chapter: s.chapter,
                chapter_title: s.chapter_title,
                themes: s.themes || [],
                virtues: s.virtues || [],
                vices: s.vices || [],
                situations: s.situations || [],
                emotions: s.emotions || []
              }
            end
          end
          m.as_json.merge(cited_sutras: cited)
        end
        render json: messages
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end
    end
  end
end
