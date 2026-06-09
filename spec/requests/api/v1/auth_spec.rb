require 'rails_helper'

RSpec.describe "Auth", type: :request do
  describe "POST /api/v1/auth/register" do
    it "creates user and returns JWT" do
      post '/api/v1/auth/register',
           params: { email: 'arjun@test.com', password: 'password123',
                     password_confirmation: 'password123' },
           as: :json
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body).to have_key('token')
      expect(body['user']['email']).to eq('arjun@test.com')
    end

    it "returns 422 with duplicate email" do
      create(:user, email: 'arjun@test.com')
      post '/api/v1/auth/register',
           params: { email: 'arjun@test.com', password: 'password123',
                     password_confirmation: 'password123' },
           as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns 422 with missing password" do
      post '/api/v1/auth/register',
           params: { email: 'test@test.com', password: '' },
           as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { create(:user, email: 'chanakya@test.com', password: 'secret123') }

    it "returns JWT on valid credentials" do
      post '/api/v1/auth/login',
           params: { email: 'chanakya@test.com', password: 'secret123' },
           as: :json
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['token']).to be_present
    end

    it "returns 401 on wrong password" do
      post '/api/v1/auth/login',
           params: { email: 'chanakya@test.com', password: 'wrong' },
           as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 on unknown email" do
      post '/api/v1/auth/login',
           params: { email: 'nobody@test.com', password: 'secret123' },
           as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/auth/me" do
    let(:user)    { create(:user) }
    let(:headers) { { 'Authorization' => "Bearer #{JwtService.encode(user_id: user.id)}" } }

    it "returns current user data" do
      get '/api/v1/auth/me', headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['email']).to eq(user.email)
    end

    it "returns 401 without token" do
      get '/api/v1/auth/me'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
