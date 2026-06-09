module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate!, only: [:register, :login]

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

      private

      def user_params
        params.permit(:email, :password, :password_confirmation)
      end

      def user_json(u)
        {
          id:                u.id,
          email:             u.email,
          plan:              u.plan,
          daily_query_count: u.daily_query_count,
          daily_reset_at:    u.daily_reset_at
        }
      end
    end
  end
end
