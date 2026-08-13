require 'rails_helper'

RSpec.describe Sutra, type: :model do
  it { should validate_presence_of(:translation_en) }
  it { should validate_presence_of(:chapter) }
  it { should validate_presence_of(:canonical_id) }
  it { should validate_numericality_of(:chapter).only_integer.is_greater_than_or_equal_to(1) }

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
  
  describe "advisory_status enum" do
    it "defaults to pending" do
      sutra = build(:sutra)
      expect(sutra.advisory_status).to eq("pending")
    end
    
    it "accepts valid statuses" do
      %w[pending active contextual excluded].each do |status|
        sutra = build(:sutra, advisory_status: status)
        expect(sutra).to be_valid
      end
    end
    
    it "rejects invalid statuses" do
      expect {
        build(:sutra, advisory_status: "invalid")
      }.to raise_error(ArgumentError)
    end
  end
  
  describe ".retrievable scope" do
    it "includes active sutras" do
      active_sutra = create(:sutra, advisory_status: :active)
      expect(Sutra.retrievable).to include(active_sutra)
    end
    
    it "includes contextual sutras" do
      contextual_sutra = create(:sutra, advisory_status: :contextual)
      expect(Sutra.retrievable).to include(contextual_sutra)
    end
    
    it "excludes pending sutras" do
      pending_sutra = create(:sutra, advisory_status: :pending)
      expect(Sutra.retrievable).not_to include(pending_sutra)
    end
    
    it "excludes excluded sutras" do
      excluded_sutra = create(:sutra, advisory_status: :excluded)
      expect(Sutra.retrievable).not_to include(excluded_sutra)
    end
  end
  
  describe "curation validation" do
    it "requires curated_by when status changes from pending" do
      sutra = create(:sutra, advisory_status: :pending)
      sutra.update(advisory_status: :active, curated_by: nil)
      expect(sutra).not_to be_valid
      expect(sutra.errors[:curated_by]).to include("must be set when changing from pending status")
    end
    
    it "requires curated_at when status changes from pending" do
      sutra = create(:sutra, advisory_status: :pending, curated_by: "Test User")
      sutra.update(advisory_status: :active, curated_at: nil)
      expect(sutra).not_to be_valid
      expect(sutra.errors[:curated_at]).to include("must be set when changing from pending status")
    end
    
    it "allows status change with proper curation info" do
      sutra = create(:sutra, advisory_status: :pending)
      sutra.update(
        advisory_status: :active,
        curated_by: "Test Curator",
        curated_at: Time.current
      )
      expect(sutra).to be_valid
      expect(sutra.advisory_status).to eq("active")
    end
  end
end
