class Consultation < ApplicationRecord
  belongs_to :user
  belongs_to :parent, class_name: "Consultation", optional: true
  has_many :children, class_name: "Consultation", foreign_key: :parent_id, dependent: :nullify
  has_many :citations, -> { order(:position) }, dependent: :destroy
  has_many :cited_sutras, through: :citations, source: :sutra
  has_many :retrieval_candidates, dependent: :delete_all

  encrypts :query_text
  encrypts :response_text

  enum :status, {
    submitted: 0,
    routed: 1,
    retrieving: 2,
    no_grounding: 3,
    generating: 4,
    delivered: 5,
    gate_failed: 6,
    errored: 7
  }

  enum :user_reaction, {
    useful: 0,
    not_what_i_needed: 1,
    didnt_apply: 2
  }, prefix: :reaction

  before_validation :assign_public_id, on: :create

  validates :public_id, presence: true, uniqueness: true
  validate :query_text_absent_when_routed

  BILLABLE_STATUSES = %w[delivered].freeze

  def billable?
    BILLABLE_STATUSES.include?(status)
  end

  private

  def assign_public_id
    self.public_id ||= SecureRandom.urlsafe_base64(9)
  end

  # FR-107: routed queries are not persisted.
  def query_text_absent_when_routed
    return unless routed?
    errors.add(:query_text, "must not be stored for routed consultations") if query_text.present?
  end
end
