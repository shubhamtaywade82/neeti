# spec/db/schema_spec.rb
require 'rails_helper'

RSpec.describe "Database schema" do
  it "sutras table has GIN index on themes" do
    idx = ActiveRecord::Base.connection.indexes(:sutras)
              .find { |i| i.name == "index_sutras_on_themes" }
    expect(idx.using).to eq :gin
  end

  it "search_vector trigger fires on insert" do
    s = Sutra.create!(canonical_id: "T.1", translation_en: "Test wisdom", chapter: 1)
    expect(s.reload.search_vector).not_to be_nil
  end
end
