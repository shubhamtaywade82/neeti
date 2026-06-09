require 'rails_helper'

RSpec.describe Sutra, type: :model do
  it { should validate_presence_of(:translation_en) }
  it { should validate_presence_of(:chapter) }

  describe "validate_uniqueness_of :canonical_id" do
    subject { create(:sutra, canonical_id: "ch1.verse1a") }
    it { should validate_uniqueness_of(:canonical_id) }
  end

  describe ".by_theme" do
    it "returns sutras matching the given theme" do
      wisdom  = create(:sutra, themes: ["wisdom"])
      courage = create(:sutra, themes: ["courage"])
      expect(Sutra.by_theme("wisdom")).to include(wisdom)
      expect(Sutra.by_theme("wisdom")).not_to include(courage)
    end
  end

  describe ".full_text_search" do
    it "finds sutras by translation text" do
      s = create(:sutra, translation_en: "Laziness is the enemy of progress")
      expect(Sutra.full_text_search("laziness")).to include(s)
    end
  end

  describe ".matching_any" do
    it "returns sutras matching any of the given themes" do
      s1 = create(:sutra, themes: ["greed"])
      s2 = create(:sutra, themes: ["courage"])
      s3 = create(:sutra, themes: ["wisdom"])
      result = Sutra.matching_any(%w[greed courage], :themes)
      expect(result).to include(s1, s2)
      expect(result).not_to include(s3)
    end
  end
end
