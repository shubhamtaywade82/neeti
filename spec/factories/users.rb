FactoryBot.define do
  factory :user do
    sequence(:email)    { |n| "user#{n}@test.com" }
    password            { "password123" }
    plan                { "free" }
    daily_query_count   { 0 }
    daily_reset_at      { Date.today }
  end
end
