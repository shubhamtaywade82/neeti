FactoryBot.define do
  factory :theme do
    sequence(:name)       { |n| "theme_#{n}" }
    category              { %w[virtue vice situation emotion concept].sample }
    related_theme_names   { [] }
  end
end
