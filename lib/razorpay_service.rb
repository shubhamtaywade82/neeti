require "razorpay"

class RazorpayService
  PLAN_IDS = {
    "seeker"     => ENV.fetch("RAZORPAY_PLAN_SEEKER",     nil),
    "strategist" => ENV.fetch("RAZORPAY_PLAN_STRATEGIST", nil),
    "raja"       => ENV.fetch("RAZORPAY_PLAN_RAJA",       nil)
  }.freeze

  PLAN_DETAILS = {
    "free"       => { name: "Free",       price_inr: 0,    queries_per_day: 3,           features: [ "3 queries/day", "Basic wisdom" ] },
    "seeker"     => { name: "Seeker",     price_inr: 199,  queries_per_day: "unlimited", features: [ "Unlimited queries", "Daily sutra", "Session history" ] },
    "strategist" => { name: "Strategist", price_inr: 499,  queries_per_day: "unlimited", features: [ "Everything in Seeker", "Persistent memory", "Goal tracking" ] },
    "raja"       => { name: "Raja",       price_inr: 1999, queries_per_day: "unlimited", features: [ "Everything in Strategist", "Human expert review", "Priority support" ] }
  }.freeze

  def initialize
    Razorpay.setup(
      ENV.fetch("RAZORPAY_KEY_ID",     "test_key"),
      ENV.fetch("RAZORPAY_KEY_SECRET", "test_secret")
    )
  end

  def create_subscription(user, plan)
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
  end

  def cancel_subscription(user)
    return { cancelled: false } unless user.razorpay_subscription_id
    Razorpay::Subscription.cancel(user.razorpay_subscription_id, cancel_at_cycle_end: 1)
    { cancelled: true }
  end

  def verify_webhook_signature(body, signature)
    Razorpay::Utility.verify_webhook_signature(
      body, signature, ENV.fetch("RAZORPAY_WEBHOOK_SECRET")
    )
  rescue => e
    Rails.logger.warn("Razorpay signature verification failed: #{e.message}")
    false
  end

  private

  def ensure_customer(user)
    return user.razorpay_customer_id if user.razorpay_customer_id.present?
    customer = Razorpay::Customer.create(
      name:    user.email.split("@").first,
      email:   user.email,
      contact: ""
    )
    customer.id
  end
end
