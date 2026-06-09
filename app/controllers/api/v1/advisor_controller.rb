# frozen_string_literal: true

module Api
  module V1
    class AdvisorController < ApplicationController
      include ActionController::Live

      before_action :check_quota!

      def create
        response.headers['Content-Type']      = 'text/event-stream'
        response.headers['Cache-Control']     = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'

        sse          = SSE.new(response.stream, retry: 300)
        conversation = load_or_create_conversation
        agent        = Neeti::Agent.new

        stream_proc = ->(token) {
          sse.write({ type: 'token', content: token }.to_json)
        }

        mode = params[:mode]&.to_sym == :cag ? :cag : :retrieval
        result = agent.advise(
          params.require(:query),
          user:         current_user,
          conversation: conversation,
          stream_proc:  stream_proc,
          mode:         mode
        )

        conversation.messages.create!(role: 'user',    content: params[:query])
        conversation.messages.create!(
          role:            'assistant',
          content:         result[:advice],
          cited_sutra_ids: result[:cited_sutra_ids],
          tokens_used:     result[:advice].split.length
        )

        current_user.increment!(:daily_query_count)

        cited = Sutra.where(id: result[:cited_sutra_ids])
                     .pluck(:canonical_id, :translation_en)
                     .map { |id, txt| { id: id, preview: txt.truncate(80) } }

        sse.write({
          type:             'complete',
          conversation_id:  conversation.id,
          cited_sutras:     cited,
          reflection_score: result[:reflection_score],
          mode:             mode
        }.to_json)

      rescue ActionController::Live::ClientDisconnected
        # normal: client disconnected mid-stream
      rescue => e
        sse.write({ type: 'error', message: 'Advisor temporarily unavailable.' }.to_json)
        Rails.logger.error("Advisor error: #{e.class}: #{e.message}")
      ensure
        sse.close
      end

      private

      def load_or_create_conversation
        if params[:conversation_id]
          current_user.conversations.find(params[:conversation_id])
        else
          current_user.conversations.create!(title: params[:query].truncate(60))
        end
      end

      def check_quota!
        if current_user.daily_reset_at < Date.today
          current_user.update!(daily_query_count: 0, daily_reset_at: Date.today)
        end
        if current_user.daily_query_count >= current_user.plan_limit
          render json: {
            error:       'Daily query limit reached.',
            limit:       current_user.plan_limit,
            upgrade_url: '/api/v1/subscriptions/plans'
          }, status: :too_many_requests
        end
      end
    end
  end
end
