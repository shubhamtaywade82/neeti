# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Api::V1::Chats", type: :request do
  let(:user) { create(:user) }
  let(:admin) { create(:user, role: 'admin') }
  let(:other_user) { create(:user) }

  describe "POST /api/v1/chats" do
    it "creates a new compliance chat and enqueues worker" do
      expect {
        post "/api/v1/chats",
             params: { message: "Review policy update" },
             headers: auth_headers(user),
             as: :json
      }.to have_enqueued_job(ComplianceWorker)

      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json["chat_id"]).to be_present
    end

    it "returns 401 when unauthorized" do
      post "/api/v1/chats", params: { message: "Hello" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/chats/:id" do
    let(:chat) { Chat.create!(user: user, agent_type: "ComplianceAgent") }
    let!(:msg) {
      chat.messages.create!(
        role: "assistant",
        content: "Here is the compliance report.",
        thinking_text: "Reasoning trace step 1",
        conversation: Conversation.create!(user: user, title: "Chat conversation")
      )
    }

    it "allows the owner to view the chat without thinking_text" do
      get "/api/v1/chats/#{chat.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["id"]).to eq(chat.id)
      expect(json["messages"].first["content"]).to eq("Here is the compliance report.")
      expect(json["messages"].first["thinking_text"]).to be_nil
    end

    it "allows admins to view the chat with thinking_text" do
      get "/api/v1/chats/#{chat.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["messages"].first["thinking_text"]).to eq("Reasoning trace step 1")
    end

    it "forbids non-owner non-admin users" do
      get "/api/v1/chats/#{chat.id}", headers: auth_headers(other_user)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
