module Api
  module V1
    class SubscriptionsController < ApplicationController
      skip_before_action :authenticate!, only: [:plans, :webhook]

      def plans
        render json: { plans: RazorpayService::PLAN_DETAILS }
      end

      def create
        plan = params.require(:plan)
        unless %w[seeker strategist raja].include?(plan)
          return render json: { error: 'Invalid plan' }, status: :unprocessable_entity
        end

        if ENV['RAZORPAY_KEY_ID'].blank?
          current_user.update!(plan: plan)
          return render json: { activated: true, plan: plan }, status: :created
        end

        result = RazorpayService.new.create_subscription(current_user, plan)
        render json: result, status: :created
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def cancel
        render json: RazorpayService.new.cancel_subscription(current_user)
      end

      def webhook
        body      = request.raw_post
        signature = request.headers['X-Razorpay-Signature']

        unless RazorpayService.new.verify_webhook_signature(body, signature)
          return render json: { error: 'Invalid signature' }, status: :forbidden
        end

        handle_event(JSON.parse(body))
        head :ok
      rescue => e
        Rails.logger.error("Webhook error: #{e.message}")
        head :ok
      end

      private

      def plan_by_plan_id
        RazorpayService::PLAN_IDS.invert
      end

      def handle_event(payload)
        event = payload['event']
        sub   = payload.dig('payload', 'subscription', 'entity')
        return unless sub

        user = User.find_by(razorpay_subscription_id: sub['id'])
        return unless user

        case event
        when 'subscription.activated'
          plan = plan_by_plan_id[sub['plan_id']]
          user.update!(plan: plan) if plan
        when 'subscription.cancelled', 'subscription.completed', 'subscription.expired'
          user.update!(plan: 'free', razorpay_subscription_id: nil)
        end
      end
    end
  end
end
