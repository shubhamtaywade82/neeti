module Api::V1
  class UsersController < ApplicationController
    def show
      render json: user_json(current_user)
    end

    def update
      if params[:password].present? || params[:email].present?
        unless current_user.authenticate(params[:current_password])
          return render json: { error: 'Current password is required to change email or password.' }, status: :unprocessable_entity
        end
      end

      if current_user.update(update_params)
        current_user.bump_token_version! if params[:password].present?
        render json: user_json(current_user)
      else
        render json: { error: current_user.errors.full_messages.first }, status: :unprocessable_entity
      end
    end

    def destroy
      unless current_user.authenticate(params[:password])
        return render json: { error: 'Incorrect password' }, status: :unprocessable_entity
      end
      current_user.destroy
      render json: { message: 'Account deleted' }
    end

    def usage
      render json: {
        plan:              current_user.plan,
        daily_query_count: current_user.daily_query_count,
        plan_limit:        current_user.plan_limit == Float::INFINITY ? 'unlimited' : current_user.plan_limit,
        daily_reset_at:    current_user.daily_reset_at,
        total_conversations: current_user.conversations.count,
        total_messages:    Message.joins(:conversation).where(conversations: { user: current_user }).count,
        insights_extracted: current_user.user_insights.count
      }
    end

    private

    def update_params
      allowed = {}
      allowed[:email]                 = params[:email]                 if params[:email].present?
      allowed[:password]              = params[:password]              if params[:password].present?
      allowed[:password_confirmation] = params[:password_confirmation] if params[:password_confirmation].present?
      allowed
    end

    def user_json(u)
      { id: u.id, email: u.email, plan: u.plan,
        daily_query_count: u.daily_query_count, daily_reset_at: u.daily_reset_at,
        created_at: u.created_at }
    end
  end
end
