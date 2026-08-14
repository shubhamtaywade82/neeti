class CreditLedgerEntry < ApplicationRecord
  belongs_to :user
  belongs_to :consultation, optional: true

  validates :amount, presence: true, numericality: { only_integer: true }
  validates :transaction_type, presence: true
  validates :balance_after, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  enum :transaction_type, {
    daily_grant: 0,
    purchase: 1,
    consultation_spend: 2,
    refund: 3
  }

  scope :grants, -> { where(transaction_type: [:daily_grant, :purchase]) }
  scope :spends, -> { where(transaction_type: [:consultation_spend, :refund]) }
  scope :recent, -> { order(created_at: :desc) }

  # Running balance should be consistent
  validate :balance_after_consistency, on: :create

  private

  def balance_after_consistency
    return if amount.blank? || balance_after.blank?

    previous_balance = user.credit_ledger_entries.where('created_at < ?', created_at).last&.balance_after || user.credit_balance

    expected_balance = previous_balance + amount
    if (expected_balance - balance_after).abs > 0.01
      errors.add(:balance_after, "should be #{expected_balance}, got #{balance_after}")
    end
  end
end
