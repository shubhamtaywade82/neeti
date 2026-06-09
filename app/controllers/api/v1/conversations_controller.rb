# frozen_string_literal: true

module Api
  module V1
    class ConversationsController < ApplicationController
      def index
        render json: current_user.conversations.order(created_at: :desc)
      end

      def show
        conversation = current_user.conversations.find(params[:id])
        render json: conversation.as_json(include: :messages)
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not found' }, status: :not_found
      end

      def destroy
        conversation = current_user.conversations.find(params[:id])
        conversation.destroy
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not found' }, status: :not_found
      end
    end
  end
end
