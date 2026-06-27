require 'rails_helper'

RSpec.describe "Admin", type: :request do
  let(:admin)        { create(:user, role: 'admin') }
  let(:regular_user) { create(:user) }
  let(:admin_headers) { { 'Authorization' => "Bearer #{JwtService.encode(user_id: admin.id)}" } }
  let(:user_headers)  { { 'Authorization' => "Bearer #{JwtService.encode(user_id: regular_user.id)}" } }

  describe "GET /api/v1/admin/stats" do
    it "returns stats for admin" do
      get '/api/v1/admin/stats', headers: admin_headers
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body).to include('users', 'conversations', 'messages', 'sutras')
    end

    it "returns 403 for regular user" do
      get '/api/v1/admin/stats', headers: user_headers
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/admin/users" do
    it "returns paginated user list" do
      create_list(:user, 3)
      get '/api/v1/admin/users', headers: admin_headers
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['users']).to be_an(Array)
      expect(body).to include('total', 'page', 'per')
    end

    it "filters by plan" do
      create(:user, plan: 'seeker')
      create(:user, plan: 'free')
      get '/api/v1/admin/users', params: { plan: 'seeker' }, headers: admin_headers
      body = JSON.parse(response.body)
      expect(body['users'].all? { |u| u['plan'] == 'seeker' }).to be true
    end
  end

  describe "PATCH /api/v1/admin/users/:id" do
    it "updates user plan" do
      target = create(:user, plan: 'free')
      patch "/api/v1/admin/users/#{target.id}",
        params: { plan: 'strategist' }, headers: admin_headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(target.reload.plan).to eq('strategist')
    end
  end

  describe "DELETE /api/v1/admin/users/:id" do
    it "deletes target user" do
      target = create(:user)
      delete "/api/v1/admin/users/#{target.id}", headers: admin_headers
      expect(response).to have_http_status(:no_content)
      expect(User.find_by(id: target.id)).to be_nil
    end

    it "prevents self-deletion" do
      delete "/api/v1/admin/users/#{admin.id}", headers: admin_headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
