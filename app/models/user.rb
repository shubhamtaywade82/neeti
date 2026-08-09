class User < ApplicationRecord
  has_secure_password

  validates :password, length: { minimum: 8 }, if: :password

  has_many :conversations,  dependent: :destroy
  has_many :user_insights,  dependent: :destroy
  has_many :collections,    dependent: :destroy
  has_many :documents,      dependent: :destroy
  has_many :consultations,  dependent: :destroy
  has_many :credit_ledger_entries, dependent: :destroy
  has_many :safety_events,  dependent: :destroy

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
  
  # --- Credit-based billing (new system) ---
  FREE_DAILY_CREDITS = 2
  
  def credit_balance
    super || 0
  end
  
  def grant_daily_credits!
    return unless plan == 'free'

    with_lock { grant_daily_credits_locked! }
  end

  def can_afford_consultation?(cost: 1)
    grant_daily_credits!
    credit_balance >= cost
  end

  def spend_credits(amount:, consultation_id:, description:)
    with_lock do
      grant_daily_credits_locked! if plan == 'free'
      raise ArgumentError, "Insufficient credits" if credit_balance < amount

      new_balance = credit_balance - amount

      CreditLedgerEntry.create!(
        user: self,
        amount: -amount,
        transaction_type: 'consultation_spend',
        description: description,
        balance_after: new_balance,
        consultation_id: consultation_id
      )

      update_column(:credit_balance, new_balance)
    end
  end
  
  def bump_token_version!
    increment!(:token_version)
  end

  def within_daily_limit?
    reset_daily_count_if_needed!
    daily_query_count < plan_limit
  end

  def plan_limit
    { 'free' => 3 }.fetch(plan, Float::INFINITY)
  end

  private

  def grant_daily_credits_locked!
    return unless last_credit_reset.nil? || last_credit_reset < Date.today

    new_balance = [credit_balance + FREE_DAILY_CREDITS, 10].min

    CreditLedgerEntry.create!(
      user: self,
      amount: FREE_DAILY_CREDITS,
      transaction_type: 'daily_grant',
      description: "Daily free credits (#{Date.today})",
      balance_after: new_balance
    )

    update_columns(credit_balance: new_balance, last_credit_reset: Date.today)
  end

  def reset_daily_count_if_needed!
    update_columns(daily_query_count: 0, daily_reset_at: Date.today) if daily_reset_at < Date.today
  end
end
