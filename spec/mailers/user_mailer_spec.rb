require "rails_helper"

RSpec.describe UserMailer, type: :mailer do
  describe "reset_password" do
    let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123') }
    let(:mail) { UserMailer.reset_password(user) }

    it "renders the headers" do
      expect(mail.subject).to eq("Reset your KOS password")
      expect(mail.to).to eq([user.email])
    end

    it "renders the body" do
      expect(mail.text_part.body.encoded).to include("Reset your KOS password")
      expect(mail.text_part.body.encoded).to include("/reset-password?token=")
    end
  end
end
