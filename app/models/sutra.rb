class Sutra < ApplicationRecord
  include PgSearch::Model

  pg_search_scope :full_text_search,
    against: { translation_en: 'A', transliteration: 'B' },
    using: { tsearch: { tsvector_column: 'search_vector', dictionary: 'english' } }

  scope :by_theme,     ->(t) { where("? = ANY(themes)", t) }
  scope :by_virtue,    ->(v) { where("? = ANY(virtues)", v) }
  scope :by_vice,      ->(v) { where("? = ANY(vices)", v) }
  scope :by_situation, ->(s) { where("? = ANY(situations)", s) }
  scope :by_emotion,   ->(e) { where("? = ANY(emotions)", e) }

  scope :matching_any, ->(arr, column) {
    where("#{column} && ARRAY[?]::text[]", arr)
  }

  validates :canonical_id,   presence: true, uniqueness: true
  validates :translation_en, presence: true
  validates :chapter,        presence: true, numericality: { only_integer: true, in: 1..17 }
end
