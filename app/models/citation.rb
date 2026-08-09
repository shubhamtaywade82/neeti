class Citation < ApplicationRecord
  belongs_to :consultation
  belongs_to :sutra
  
  validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  
  scope :ordered, -> { order(position: :asc) }
end
