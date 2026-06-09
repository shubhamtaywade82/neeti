require 'rails_helper'

RSpec.describe "Subscriptions", type: :request do
  let(:user)    { create(:user, plan: 'free') }
  let(:headers) { auth_headers(user) }

  describe "GET /api/v1/subscriptions/plans" do
    it "returns all plan details without auth" do
      # plans endpoint is public (skip auth)
      get '/api/v1/subscriptions/plans'
      expect(response).to have_http_status(:ok)
      plans = JSON.parse(response.body)['plans']
      expect(plans.keys).to include('free', 'seeker', 'strategist', 'raja')
    end

    it "includes pricing for each plan" do
      get '/api/v1/subscriptions/plans', headers: headers
      plans = JSON.parse(response.body)['plans']
      expect(plans['seeker']['price_inr']).to eq(199)
      expect(plans['raja']['price_inr']).to eq(1999)
    end
  end

  describe "POST /api/v1/subscriptions/webhook" do
    let!(:subscriber) { create(:user, razorpay_subscription_id: 'sub_abc123', plan: 'free') }

    let(:activated_payload) do
      {
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: { id: 'sub_abc123', plan_id: 'plan_seeker_123' }
          }
        }
      }.to_json
    end

    let(:cancelled_payload) do
      {
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: { id: 'sub_abc123', plan_id: 'plan_seeker_123' }
          }
        }
      }.to_json
    end

    before do
      allow_any_instance_of(RazorpayService).to receive(:verify_webhook_signature).and_return(true)
      stub_const("RazorpayService::PLAN_IDS", {
        'seeker' => 'plan_seeker_123',
        'strategist' => 'plan_strategist_123',
        'raja' => 'plan_raja_123'
      })
    end

    it "activates user plan on subscription.activated" do
      post '/api/v1/subscriptions/webhook',
           params: activated_payload,
           headers: { 'Content-Type' => 'application/json', 'X-Razorpay-Signature' => 'valid' }
      expect(response).to have_http_status(:ok)
      expect(subscriber.reload.plan).to eq('seeker')
    end

    it "resets plan to free on subscription.cancelled" do
      subscriber.update!(plan: 'seeker')
      post '/api/v1/subscriptions/webhook',
           params: cancelled_payload,
           headers: { 'Content-Type' => 'application/json', 'X-Razorpay-Signature' => 'valid' }
      expect(subscriber.reload.plan).to eq('free')
    end

    it "returns 403 on invalid signature" do
      allow_any_instance_of(RazorpayService).to receive(:verify_webhook_signature).and_return(false)
      post '/api/v1/subscriptions/webhook',
           params: activated_payload,
           headers: { 'Content-Type' => 'application/json', 'X-Razorpay-Signature' => 'invalid' }
      expect(response).to have_http_status(:forbidden)
    end
  end
end
