require 'rails_helper'

RSpec.describe "Users", type: :request do
  let(:user)    { create(:user, email: 'test@neeti.com', password: 'password123') }
  let(:headers) { { 'Authorization' => "Bearer #{JwtService.encode(user_id: user.id)}" } }

  describe "GET /api/v1/users/me" do
    it "returns current user" do
      get '/api/v1/users/me', headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['email']).to eq('test@neeti.com')
    end
  end

  describe "PATCH /api/v1/users/me" do
    it "updates email with correct current_password" do
      patch '/api/v1/users/me',
        params: { email: 'new@neeti.com', current_password: 'password123' },
        headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(user.reload.email).to eq('new@neeti.com')
    end

    it "rejects wrong current_password" do
      patch '/api/v1/users/me',
        params: { email: 'new@neeti.com', current_password: 'wrong' },
        headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "updates password" do
      patch '/api/v1/users/me',
        params: { current_password: 'password123', password: 'newpass456', password_confirmation: 'newpass456' },
        headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(user.reload.authenticate('newpass456')).to be_truthy
    end
  end

  describe "DELETE /api/v1/users/me" do
    it "deletes account with correct password" do
      delete '/api/v1/users/me',
        params: { password: 'password123' },
        headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(User.find_by(id: user.id)).to be_nil
    end

    it "rejects wrong password" do
      delete '/api/v1/users/me',
        params: { password: 'wrong' },
        headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "GET /api/v1/users/usage" do
    it "returns usage stats" do
      get '/api/v1/users/usage', headers: headers
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body).to include('plan', 'daily_query_count', 'plan_limit')
    end
  end
end
