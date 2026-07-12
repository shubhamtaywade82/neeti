class SutraVice < ApplicationRecord
  belongs_to :sutra
  belongs_to :theme

  validates :sutra_id, uniqueness: { scope: :theme_id }
end
