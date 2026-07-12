class Collection < ApplicationRecord
  belongs_to :user
  has_many :documents, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :user_id }
  validates :slug, uniqueness: { scope: :user_id }, allow_nil: true

  before_validation :set_slug, if: -> { slug.blank? && name.present? }

  scope :ordered, -> { order(position: :asc, created_at: :desc) }

  private

  def set_slug
    self.slug = name.parameterize
  end
end
