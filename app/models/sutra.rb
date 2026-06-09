class Sutra < ApplicationRecord
  include PgSearch::Model

  pg_search_scope :full_text_search,
    using: { tsearch: { tsvector_column: 'search_vector', dictionary: 'english' } }

  scope :by_theme,     ->(t) { where("? = ANY(themes)", t) }
  scope :by_virtue,    ->(v) { where("? = ANY(virtues)", v) }
  scope :by_vice,      ->(v) { where("? = ANY(vices)", v) }
  scope :by_situation, ->(s) { where("? = ANY(situations)", s) }
  scope :by_emotion,   ->(e) { where("? = ANY(emotions)", e) }

  SEARCHABLE_COLUMNS = %w[themes virtues vices situations emotions].freeze

  scope :matching_any, ->(arr, column) {
    col = column.to_s
    raise ArgumentError, "Invalid column: #{col}" unless SEARCHABLE_COLUMNS.include?(col)
    where("#{col} && ARRAY[?]::text[]", arr)
  }

  validates :canonical_id,   presence: true, uniqueness: true
  validates :translation_en, presence: true
  validates :chapter,        presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 17 }
end
