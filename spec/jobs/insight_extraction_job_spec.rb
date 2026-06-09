# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InsightExtractionJob, type: :job do
  let(:user)     { create(:user) }
  let(:provider) { Neeti::Providers::NullProvider.new(response: '[{"type":"goal","content":"User wants better leadership"}]') }

  before do
    allow(Neeti::ModelRouter).to receive(:for).and_return(provider)
  end

  it "extracts and persists user insights" do
    expect {
      described_class.perform_now(user.id, "How do I lead?", "Leadership wisdom here.")
    }.to change(UserInsight, :count).by(1)
  end

  it "persists the correct insight type and content" do
    described_class.perform_now(user.id, "How do I lead?", "Leadership wisdom here.")
    insight = user.user_insights.last
    expect(insight.insight_type).to eq("goal")
    expect(insight.content).to include("leadership")
  end

  it "ignores invalid insight types" do
    allow(provider).to receive(:chat).and_return('[{"type":"invalid","content":"bad"}]')
    expect {
      described_class.perform_now(user.id, "test", "test")
    }.not_to change(UserInsight, :count)
  end
end
