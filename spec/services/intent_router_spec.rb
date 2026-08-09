# spec/services/intent_router_spec.rb
require "rails_helper"

RSpec.describe Neeti::IntentRouter do
  describe "#call" do
    context "lexical matches" do
      it "routes self-harm queries" do
        verdict = described_class.new("I want to end my life").call

        expect(verdict.routed?).to be true
        expect(verdict.category).to eq(:self_harm)
        expect(verdict.stage).to eq(:lexical)
      end

      it "detects suicide keywords" do
        verdict = described_class.new("How can I kill myself without pain").call

        expect(verdict.routed?).to be true
        expect(verdict.category).to eq(:self_harm)
      end

      it "detects abuse patterns" do
        verdict = described_class.new("My husband hits me and won't let me leave").call

        expect(verdict.routed?).to be true
        expect(verdict.category).to eq(:abuse)
      end

      it "detects medical questions" do
        verdict = described_class.new("What dosage of ibuprofen mg is safe with chest pain").call

        expect(verdict.routed?).to be true
        expect(verdict.category).to eq(:medical)
      end

      it "prioritizes self_harm over other categories when multiple match" do
        verdict = described_class.new("I want to end my life, also considering a lawsuit").call

        expect(verdict.category).to eq(:self_harm)
      end
    end

    context "no lexical or classifier match" do
      before do
        allow(SafetyClassifier).to receive(:new).and_return(instance_double(SafetyClassifier, call: SafetyClassifier::Result.new(categories: [], confidence: 0.0)))
      end

      it "does not route ordinary advice queries" do
        verdict = described_class.new("How do I negotiate a salary raise with my manager").call

        expect(verdict.routed?).to be false
        expect(verdict.category).to be_nil
      end
    end

    context "classifier fallback" do
      it "routes via the classifier when no lexical pattern matches" do
        allow(SafetyClassifier).to receive(:new).and_return(
          instance_double(SafetyClassifier, call: SafetyClassifier::Result.new(categories: [ :legal ], confidence: 0.8))
        )

        verdict = described_class.new("Ambiguous phrasing the regex can't catch").call

        expect(verdict.routed?).to be true
        expect(verdict.category).to eq(:legal)
        expect(verdict.stage).to eq(:classifier)
      end

      it "fails closed to the medical bucket when the classifier raises" do
        allow(SafetyClassifier).to receive(:new).and_raise(StandardError, "timeout")

        verdict = described_class.new("Ambiguous phrasing the regex can't catch").call

        expect(verdict.routed?).to be true
        expect(verdict.category).to eq(:medical)
        expect(verdict.stage).to eq(:classifier)
      end
    end
  end
end
