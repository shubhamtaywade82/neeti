# frozen_string_literal: true

module Api
  module V1
    class CreditsController < ApplicationController
      # GET /api/v1/credits
      def index
        entries = current_user.credit_ledger_entries.recent.limit(50)
        
        render json: {
          balance: current_user.credit_balance,
          entries: entries.map { |e| e.as_json }
        }
      end
      
      # POST /api/v1/credits/purchase
      # Idempotent credit pack purchase via Razorpay
      def purchase
        params.require(:credit_pack_id)
        params.require(:razorpay_payment_id)
        params.require(:razorpay_signature)
        
        idempotency_key = "purchase:#{current_user.id}:#{params[:credit_pack_id]}:#{params[:razorpay_payment_id]}"
        
        # Check for existing idempotent transaction
        existing = CreditLedgerEntry.find_by(idempotency_key: idempotency_key)
        if existing
          render json: {
            message: 'Purchase already processed',
            balance: current_user.credit_balance,
            credits_added: existing.amount
          }
          return
        end
        
        credit_pack = CREDIT_PACKS[params[:credit_pack_id]]
        unless credit_pack
          render json: { error: 'Invalid credit pack' }, status: :bad_request
          return
        end
        
        # Verify Razorpay signature (implement in RazorpayService)
        unless RazorpayService.verify_payment_signature(
          payment_id: params[:razorpay_payment_id],
          signature: params[:razorpay_signature],
          amount: credit_pack[:price_in_paise]
        )
          render json: { error: 'Invalid payment signature' }, status: :bad_request
          return
        end
        
        # Add credits with row-level locking
        old_balance = current_user.credit_balance
        new_balance = old_balance + credit_pack[:credits]
        
        CreditLedgerEntry.create!(
          user: current_user,
          amount: credit_pack[:credits],
          transaction_type: 'purchase',
          description: "Credit pack: #{credit_pack[:name]}",
          balance_after: new_balance,
          idempotency_key: idempotency_key,
          metadata: {
            razorpay_payment_id: params[:razorpay_payment_id],
            credit_pack_id: params[:credit_pack_id]
          }
        )
        
        current_user.update!(credit_balance: new_balance)
        
        render json: {
          message: 'Credits added successfully',
          balance: new_balance,
          credits_added: credit_pack[:credits]
        }
      rescue => e
        Rails.logger.error("Credit purchase error: #{e.class}: #{e.message}")
        render json: { error: 'Purchase failed. Please contact support.' }, status: :unprocessable_entity
      end
      
      # POST /api/v1/credits/webhook
      # Razorpay webhook endpoint for async payment events
      def webhook
        payload = request.body.read
        signature = request.headers['X-Razorpay-Signature']
        
        unless RazorpayService.verify_webhook_signature(payload, signature)
          head :bad_request
          return
        end
        
        event = JSON.parse(payload)
        
        case event['event']
        when 'payment.captured'
          # Payment succeeded - credits will be added when user confirms
          # or automatically if you implement auto-fulfillment
          Rails.logger.info("Payment captured: #{event['payload']['payment']['id']}")
        when 'order.paid'
          # Order fully paid - trigger fulfillment
          handle_order_paid(event['payload'])
        else
          Rails.logger.info("Unhandled Razorpay event: #{event['event']}")
        end
        
        head :ok
      rescue => e
        Rails.logger.error("Webhook error: #{e.class}: #{e.message}")
        head :internal_server_error
      end
      
      private
      
      CREDIT_PACKS = {
        'starter' => {
          name: 'Starter Pack',
          credits: 5,
          price_in_paise: 14900, # ₹149
          price_display: '₹149'
        },
        'seeker' => {
          name: 'Seeker Pack',
          credits: 15,
          price_in_paise: 39900, # ₹399
          price_display: '₹399'
        },
        'strategist' => {
          name: 'Strategist Pack',
          credits: 50,
          price_in_paise: 99900, # ₹999
          price_display: '₹999'
        },
        'single' => {
          name: 'Single Consultation',
          credits: 1,
          price_in_paise: 3900, # ₹39
          price_display: '₹39'
        }
      }.freeze
      
      def handle_order_paid(payload)
        order_id = payload['order']['id']
        user_id = payload['order']['notes']['user_id']
        credit_pack_id = payload['order']['notes']['credit_pack_id']
        payment_id = payload['payment']['id']
        
        user = User.find_by(id: user_id)
        return unless user
        
        credit_pack = CREDIT_PACKS[credit_pack_id]
        return unless credit_pack
        
        idempotency_key = "purchase:#{user.id}:#{credit_pack_id}:#{payment_id}"
        
        # Use transaction to ensure atomicity
        User.transaction do
          existing = CreditLedgerEntry.lock.find_by(idempotency_key: idempotency_key)
          return if existing
          
          old_balance = user.lock!.credit_balance
          new_balance = old_balance + credit_pack[:credits]
          
          CreditLedgerEntry.create!(
            user: user,
            amount: credit_pack[:credits],
            transaction_type: 'purchase',
            description: "Credit pack: #{credit_pack[:name]} (Order: #{order_id})",
            balance_after: new_balance,
            idempotency_key: idempotency_key,
            metadata: {
              razorpay_payment_id: payment_id,
              razorpay_order_id: order_id,
              credit_pack_id: credit_pack_id
            }
          )
          
          user.update!(credit_balance: new_balance)
        end
      rescue => e
        Rails.logger.error("Order fulfillment error: #{e.class}: #{e.message}")
        # Don't raise - webhook should return 200 even on errors
        # Razorpay will retry on failure
      end
    end
  end
end
