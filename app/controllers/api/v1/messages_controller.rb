# frozen_string_literal: true

module Api
  module V1
    class MessagesController < ApplicationController
      def index
        conversation = current_user.conversations.find(params[:conversation_id])
        render json: conversation.messages.order(:created_at)
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not found' }, status: :not_found
      end
    end
  end
end
