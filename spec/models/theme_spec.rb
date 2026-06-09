require 'rails_helper'

RSpec.describe Theme, type: :model do
  describe ".expand_related" do
    it "walks the graph up to depth 2" do
      create(:theme, name: "greed",       related_theme_names: ["desire"])
      create(:theme, name: "desire",      related_theme_names: ["contentment"])
      create(:theme, name: "contentment", related_theme_names: [])
      result = Theme.expand_related(["greed"], depth: 2)
      expect(result).to include("greed", "desire", "contentment")
    end
  end
end
