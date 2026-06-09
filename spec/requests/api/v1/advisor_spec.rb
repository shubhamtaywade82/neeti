require 'rails_helper'

RSpec.describe "POST /api/v1/advice", type: :request do
  let(:user)    { create(:user, plan: 'seeker') }
  let(:headers) { auth_headers(user) }

  before do
    create_list(:sutra, 5, themes: ["wisdom"])
    allow_any_instance_of(Neeti::Agent).to receive(:advise).and_return({
      advice:          "Know your enemy as yourself.",
      cited_sutra_ids: Sutra.first(3).map(&:id),
      reflection_score: 8
    })
  end

  it "returns 200" do
    post '/api/v1/advice',
         params: { query: "How do I handle betrayal?" },
         headers: headers,
         as: :json
    expect(response.status).to eq(200)
  end

  it "creates a conversation and messages" do
    expect {
      post '/api/v1/advice',
           params: { query: "How do I handle betrayal?" },
           headers: headers,
           as: :json
    }.to change(Conversation, :count).by(1).and change(Message, :count).by(2)
  end

  it "enforces daily quota for free tier" do
    free_user = create(:user, plan: 'free', daily_query_count: 3, daily_reset_at: Date.today)
    post '/api/v1/advice',
         params: { query: "test" },
         headers: auth_headers(free_user),
         as: :json
    expect(response.status).to eq(429)
  end

  it "returns 401 without auth" do
    post '/api/v1/advice', params: { query: "test" }, as: :json
    expect(response.status).to eq(401)
  end
end
