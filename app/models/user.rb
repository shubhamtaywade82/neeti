class User < ApplicationRecord
  has_secure_password

  validates :password, length: { minimum: 8 }, if: :password

  has_many :conversations,  dependent: :destroy
  has_many :user_insights,  dependent: :destroy
  has_many :collections,    dependent: :destroy
  has_many :documents,      dependent: :destroy

  PLANS = %w[free seeker strategist raja].freeze
  ROLES = %w[user admin].freeze
  validates :role, inclusion: { in: ROLES }
  def admin? = role == 'admin'

  validates :email,
            presence: true,
            uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :plan, inclusion: { in: PLANS }

  before_save { self.email = email.downcase }

  def within_daily_limit?
    reset_daily_count_if_needed!
    daily_query_count < plan_limit
  end

  def plan_limit
    { 'free' => 3 }.fetch(plan, Float::INFINITY)
  end

  private

  def reset_daily_count_if_needed!
    update_columns(daily_query_count: 0, daily_reset_at: Date.today) if daily_reset_at < Date.today
  end
end
