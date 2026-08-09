module Api
  module V1
    class DailySutraController < ApplicationController
      def show
        count = Sutra.count
        return render json: { error: "No sutras seeded" }, status: :service_unavailable if count.zero?

        index  = Date.today.yday % count
        sutra  = Sutra.order(:id).offset(index).first

        render json: {
          date:  Date.today.iso8601,
          sutra: {
            canonical_id:   sutra.canonical_id,
            chapter:        sutra.chapter,
            chapter_title:  sutra.chapter_title,
            translation_en: sutra.translation_en,
            themes:         sutra.themes
          }
        }
      end
    end
  end
end
