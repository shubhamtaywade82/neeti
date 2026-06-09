require 'rails_helper'

RSpec.describe JwtService do
  describe ".encode / .decode" do
    it "encodes and decodes a payload" do
      token   = JwtService.encode(user_id: 42)
      payload = JwtService.decode(token)
      expect(payload['user_id']).to eq(42)
    end

    it "raises JWT::DecodeError on tampered token" do
      token = JwtService.encode(user_id: 1)
      expect { JwtService.decode(token + "tampered") }.to raise_error(JWT::DecodeError)
    end
  end
end
