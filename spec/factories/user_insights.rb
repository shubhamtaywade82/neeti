FactoryBot.define do
  factory :user_insight do
    association :user
    insight_type { %w[goal challenge preference].sample }
    content      { Faker::Lorem.sentence(word_count: 6) }
  end
end
