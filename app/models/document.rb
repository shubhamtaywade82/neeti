class Document < ApplicationRecord
  belongs_to :user
  belongs_to :collection, optional: true
  has_many :chunks, class_name: 'DocumentChunk', dependent: :destroy

  validates :filename, presence: true
  validates :file_type, presence: true, inclusion: { in: %w[pdf md txt docx] }
  validates :file_size, numericality: { less_than_or_equal_to: 20.megabytes }, if: -> { file_size.present? }

  scope :ready, -> { where(status: 'ready') }
  scope :processing, -> { where(status: 'processing') }
  scope :recent, -> { order(created_at: :desc) }

  ALLOWED_TYPES = {
    'application/pdf' => 'pdf',
    'text/markdown' => 'md',
    'text/plain' => 'txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx'
  }.freeze

  MAX_FILE_SIZE = 20.megabytes
end
