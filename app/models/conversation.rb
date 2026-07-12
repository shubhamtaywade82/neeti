class Conversation < ApplicationRecord
  belongs_to :user
  has_many :messages, dependent: :destroy

  validates :advisor, presence: true, inclusion: { in: %w[chanakya gita stoic sun_tzu] }
end
