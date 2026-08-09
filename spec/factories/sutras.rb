FactoryBot.define do
  factory :sutra do
    sequence(:canonical_id) { |n| "#{(n / 30) + 1}.#{(n % 30) + 1}" }
    sequence(:chapter)      { |n| (n % 17) + 1 }
    chapter_title           { "Chapter #{chapter}" }
    translation_en          { Faker::Lorem.sentence(word_count: 10) }
    themes                  { %w[wisdom leadership greed].sample(2) }
    virtues                 { %w[patience courage humility].sample(1) }
    vices                   { %w[greed anger laziness].sample(1) }
    situations              { %w[career conflict leadership].sample(1) }
    emotions                { %w[fear ambition desire].sample(1) }

    after(:build) do |sutra|
      next if sutra.pending? || sutra.advisory_status.nil?

      sutra.curated_by ||= "Test Curator"
      sutra.curated_at ||= Time.current
    end
  end
end
