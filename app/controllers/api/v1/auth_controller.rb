module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate!, only: [:register, :login, :forgot_password, :reset_password]

      def register
        user = User.new(user_params)
        if user.save
          render json: { token: JwtService.encode(user_id: user.id), user: user_json(user) },
                 status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: params[:email]&.downcase)
        if user&.authenticate(params[:password])
          render json: { token: JwtService.encode(user_id: user.id), user: user_json(user) }
        else
          render json: { error: 'Invalid credentials' }, status: :unauthorized
        end
      end

      def me
        render json: user_json(current_user)
      end

      def forgot_password
        user = User.find_by(email: params[:email]&.downcase)
        if user
          user.update!(
            reset_token: SecureRandom.urlsafe_base64(32),
            reset_sent_at: Time.current
          )
          UserMailer.reset_password(user).deliver_later
        end
        render json: { message: 'If the email exists, a reset link has been sent.' }
      end

      def reset_password
        user = User.find_by(reset_token: params[:token])
        if !user || user.reset_sent_at < 2.hours.ago
          render json: { error: 'Reset token invalid or expired.' }, status: :unprocessable_entity
          return
        end
        unless params[:password].present? && params[:password].length >= 8
          render json: { error: 'Password must be at least 8 characters.' }, status: :unprocessable_entity
          return
        end
        user.update!(
          password: params[:password],
          password_confirmation: params[:password],
          reset_token: nil,
          reset_sent_at: nil
        )
        render json: { message: 'Password reset successfully.' }
      end

      private

      def user_params
        params.permit(:email, :password, :password_confirmation)
      end

      def user_json(u)
        {
          id:                u.id,
          email:             u.email,
          plan:              u.plan,
          role:              u.role,
          daily_query_count: u.daily_query_count,
          daily_reset_at:    u.daily_reset_at
        }
      end
    end
  end
end
