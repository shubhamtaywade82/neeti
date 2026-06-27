require 'rails_helper'

RSpec.describe Neeti::Retriever do
  let(:classifier) { double("LlmClassifier", classify_themes: []) }
  subject(:retriever) { described_class.new(llm_classifier: classifier, limit: 5) }

  describe "#retrieve" do
    context "Layer 1 — metadata match sufficient" do
      it "returns sutras without calling LLM when metadata match gives 3+ results" do
        create_list(:sutra, 3, themes: ["laziness"], situations: ["career"])
        result = retriever.retrieve("I am lazy at work")
        expect(result.size).to be >= 3
        expect(classifier).not_to have_received(:classify_themes)
      end
    end

    context "Layer 2 — FTS when metadata insufficient" do
      it "uses full-text search when less than 3 metadata results" do
        create(:sutra, translation_en: "Laziness is the enemy of progress", themes: ["irrelevant"])
        create(:sutra, translation_en: "The idle mind betrays its master", themes: ["irrelevant"])
        result = retriever.retrieve("laziness enemy")
        expect(result.size).to be >= 1
      end
    end

    context "Layer 3 — LLM classifier called when layers 1+2 insufficient" do
      it "calls classify_themes and queries sutras by returned theme names" do
        3.times { create(:sutra, themes: ["self-discipline"]) }
        allow(classifier).to receive(:classify_themes).and_return(["self-discipline"])
        result = retriever.retrieve("how to overcome procrastination")
        expect(result.size).to be >= 3
        expect(classifier).to have_received(:classify_themes)
      end
    end

    context "Layer 4 — graph expansion as last resort" do
      before do
        # Create target themes FIRST so relationship setters can find them
        create(:theme, name: "contentment", related_theme_names: [])
        create(:theme, name: "desire",  category: "emotion", related_theme_names: ["contentment"])
        create(:theme, name: "greed",   category: "vice",    related_theme_names: ["desire"])
        create(:sutra, themes: ["greed"])
        create(:sutra, themes: ["greed"])
        allow(classifier).to receive(:classify_themes).and_return([])
      end

      it "expands through the theme graph when prior layers insufficient" do
        desire_sutra = create(:sutra, themes: ["desire"])
        # "greed" keyword matches the 2 greed sutras (below threshold=3), then
        # layer 4 expands greed→desire and includes the desire_sutra
        result = retriever.retrieve("greed and wealth")
        expect(result).to include(desire_sutra)
      end
    end
  end
end
