require 'rails_helper'

RSpec.describe "Conversations", type: :request do
  let(:user)    { create(:user) }
  let(:headers) { auth_headers(user) }

  describe "GET /api/v1/conversations" do
    it "returns user's conversations" do
      create_list(:conversation, 3, user: user)
      create(:conversation) # another user's conversation
      get '/api/v1/conversations', headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).size).to eq(3)
    end
  end

  describe "DELETE /api/v1/conversations/:id" do
    it "deletes conversation belonging to current user" do
      convo = create(:conversation, user: user)
      delete "/api/v1/conversations/#{convo.id}", headers: headers
      expect(response).to have_http_status(:no_content)
    end

    it "returns 404 for conversation belonging to another user" do
      other_convo = create(:conversation)
      delete "/api/v1/conversations/#{other_convo.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end
end
