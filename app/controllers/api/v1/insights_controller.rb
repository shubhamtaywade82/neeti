# frozen_string_literal: true

module Api
  module V1
    class InsightsController < ApplicationController
      def index
        insights = current_user.user_insights.order(created_at: :desc)

        # Seed some initial high-fidelity insights if user has none,
        # so they can see the Memory dashboard populated.
        if insights.empty?
          initial_data = [
            { type: 'goal', content: 'Recurring interest in leadership under uncertainty' },
            { type: 'preference', content: 'Prefers principle-based advice over tactical shortcuts' },
            { type: 'pattern', content: 'Building a decision framework for strategic risk' },
            { type: 'goal', content: 'Actively building a knowledge system for decision-making' }
          ]
          initial_data.each do |item|
            current_user.user_insights.create!(
              insight_type: item[:type],
              content: item[:content]
            )
          end
          insights = current_user.user_insights.order(created_at: :desc)
        end

        rendered = insights.map do |i|
          emoji = case i.insight_type
                  when 'goal' then '🎯'
                  when 'preference' then '⚖️'
                  when 'pattern' then '🔍'
                  when 'challenge' then '⚠️'
                  else '👤'
                  end

          {
            id: i.id,
            type: i.insight_type || 'goal',
            icon: emoji,
            label: i.content,
            source: 'Derived from active sessions',
            confidence: 0.90,
            explicit: true,
            date: i.created_at.strftime('%b %d, %Y')
          }
        end

        render json: rendered
      end

      def destroy
        insight = current_user.user_insights.find(params[:id])
        insight.destroy
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not found' }, status: :not_found
      end
    end
  end
end
