# app/controllers/api/v1/chats_controller.rb
module Api
  module V1
    class ChatsController < ApplicationController
      before_action :set_chat, only: [:show]
      before_action :authorize_chat!, only: [:show]

      def create
        # Create a persisted chat session tied to the user
        chat = Chat.create!(user: current_user, agent_type: 'ComplianceAgent')

        # Queue the agent to process the message in the background
        ComplianceWorker.perform_later(chat.id, params[:message])

        render json: { chat_id: chat.id }, status: :accepted
      end

      def show
        # Return chat with messages including thinking traces for admins
        render json: {
          id: @chat.id,
          messages: @chat.messages.order(created_at: :asc).map do |msg|
            {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              thinking_text: current_user.admin? ? msg.thinking_text : nil,
              created_at: msg.created_at
            }
          end
        }
      end

      private

      def set_chat
        @chat = Chat.find(params[:id])
      end

      def authorize_chat!
        unless @chat.user_id == current_user.id || current_user.admin?
          render json: { error: "Unauthorized" }, status: :forbidden
        end
      end
    end
  end
end
