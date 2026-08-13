require 'razorpay'

class RazorpayService
  # Legacy subscription plans (deprecated for v1.0 - replaced with credit packs)
  PLAN_IDS = {
    'seeker'     => ENV.fetch('RAZORPAY_PLAN_SEEKER',     nil),
    'strategist' => ENV.fetch('RAZORPAY_PLAN_STRATEGIST', nil)
    # 'raja' removed - undeliverable by solo founder per PRD
  }.freeze

  # Credit packs for one-time purchase (v1.0 billing model)
  CREDIT_PACKS = {
    'single' => {
      name: 'Single Consultation',
      credits: 1,
      price_in_paise: 3900, # ₹39
      price_display: '₹39'
    },
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
    }
  }.freeze

  def initialize
    Razorpay.setup(
      ENV.fetch('RAZORPAY_KEY_ID',     'test_key'),
      ENV.fetch('RAZORPAY_KEY_SECRET', 'test_secret')
    )
  end

  # Create Razorpay order for credit pack purchase
  def create_order(user, credit_pack_id)
    credit_pack = CREDIT_PACKS[credit_pack_id]
    return nil unless credit_pack

    customer_id = ensure_customer(user)
    
    order = Razorpay::Order.create(
      amount: credit_pack[:price_in_paise],
      currency: 'INR',
      receipt: "order_#{user.id}_#{Time.now.to_i}",
      customer_id: customer_id,
      notes: {
        user_id: user.id.to_s,
        credit_pack_id: credit_pack_id,
        credits: credit_pack[:credits].to_s
      }
    )
    
    {
      order_id: order.id,
      amount: credit_pack[:price_in_paise],
      currency: 'INR',
      credits: credit_pack[:credits]
    }
  rescue => e
    Rails.logger.error("Razorpay order creation failed: #{e.message}")
    nil
  end

  # Verify payment signature for direct payment flow
  def verify_payment_signature(payment_id:, signature:, amount:)
    # Generate expected signature using Razorpay secret
    expected_signature = OpenSSL::HMAC.hexdigest(
      'sha256',
      ENV.fetch('RAZORPAY_KEY_SECRET'),
      "#{payment_id}"
    )
    
    # In production, use Razorpay's official verification
    signature == expected_signature
  rescue => e
    Rails.logger.error("Payment signature verification failed: #{e.message}")
    false
  end

  # Verify webhook signature
  def verify_webhook_signature(payload, signature)
    Razorpay::Utility.verify_webhook_signature(
      payload, signature, ENV.fetch('RAZORPAY_WEBHOOK_SECRET')
    )
    true
  rescue => e
    Rails.logger.warn("Razorpay webhook signature verification failed: #{e.message}")
    false
  end

  def create_subscription(user, plan)
    return nil unless PLAN_IDS.key?(plan)
    
    customer_id  = ensure_customer(user)
    subscription = Razorpay::Subscription.create(
      plan_id:     PLAN_IDS.fetch(plan),
      customer_id: customer_id,
      quantity:    1,
      total_count: 12,
      notes:       { user_id: user.id.to_s, plan: plan }
    )
    user.update!(
      razorpay_customer_id:     customer_id,
      razorpay_subscription_id: subscription.id
    )
    { subscription_id: subscription.id, short_url: subscription.short_url }
  rescue => e
    Rails.logger.error("Subscription creation failed: #{e.message}")
    nil
  end

  def cancel_subscription(user)
    return { cancelled: false } unless user.razorpay_subscription_id
    Razorpay::Subscription.cancel(user.razorpay_subscription_id, cancel_at_cycle_end: 1)
    { cancelled: true }
  rescue => e
    Rails.logger.error("Subscription cancellation failed: #{e.message}")
    { cancelled: false }
  end

  private

  def ensure_customer(user)
    return user.razorpay_customer_id if user.razorpay_customer_id.present?
    customer = Razorpay::Customer.create(
      name:    user.email.split('@').first,
      email:   user.email,
      contact: ''
    )
    customer.id
  rescue => e
    Rails.logger.error("Customer creation failed: #{e.message}")
    nil
  end
end
