# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Neeti::Agent do
  let(:provider)  { instance_double(Neeti::Providers::NullProvider) }
  let(:retriever) { instance_double(Neeti::Retriever) }
  let(:user)      { create(:user) }
  let(:convo)     { create(:conversation, user: user) }
  let(:sutras)    { create_list(:sutra, 3, themes: [ "wisdom" ]) }

  subject(:agent) { described_class.new(retriever: retriever, provider: provider) }

  before do
    allow(retriever).to receive(:retrieve).and_return(sutras)
    allow(provider).to receive(:chat)
      .and_return("Knowledge is the greatest weapon.",
                  '{"good":true,"issues":[],"score":8}')
  end

  describe "#advise" do
    it "returns advice string and cited sutra IDs" do
      result = agent.advise("How to handle betrayal?", user: user, conversation: convo)
      expect(result[:advice]).to include("Knowledge")
      expect(result[:cited_sutra_ids]).to match_array(sutras.map(&:id))
    end

    it "returns a reflection_score" do
      result = agent.advise("How to lead?", user: user, conversation: convo)
      expect(result[:reflection_score]).to be_a(Integer)
    end

    it "enqueues InsightExtractionJob" do
      expect {
        agent.advise("How to lead a team?", user: user, conversation: convo)
      }.to have_enqueued_job(InsightExtractionJob)
    end

    context "when reflection score is low" do
      before do
        # Use a single sutra to trigger reflection (needs_reflection? requires < 2)
        allow(retriever).to receive(:retrieve).and_return(sutras.take(1))
        allow(provider).to receive(:chat).and_return(
          "Weak advice.",
          '{"good":false,"issues":["lacks sutra citations"],"score":4}',
          "Refined advice grounded in wisdom."
        )
      end

      it "refines the draft when reflection fails" do
        result = agent.advise("What to do about envy?", user: user, conversation: convo)
        expect(result[:advice]).to include("Refined")
      end
    end
  end
end
