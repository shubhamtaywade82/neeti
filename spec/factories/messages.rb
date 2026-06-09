FactoryBot.define do
  factory :message do
    association :conversation
    role    { %w[user assistant].sample }
    content { Faker::Lorem.sentence(word_count: 8) }
    cited_sutra_ids { [] }
  end
end
