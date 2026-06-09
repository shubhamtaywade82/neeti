class Sutra < ApplicationRecord
  include PgSearch::Model

  pg_search_scope :full_text_search,
    using: { tsearch: { tsvector_column: 'search_vector', dictionary: 'english' } }

  # --- Normalized associations (Phase 2) ---
  has_many :sutra_themes,     dependent: :delete_all
  has_many :themes,     through: :sutra_themes

  has_many :sutra_virtues,    dependent: :delete_all
  has_many :virtues,    through: :sutra_virtues, source: :theme

  has_many :sutra_vices,      dependent: :delete_all
  has_many :vices,      through: :sutra_vices, source: :theme

  has_many :sutra_situations, dependent: :delete_all
  has_many :situations, through: :sutra_situations, source: :theme

  has_many :sutra_emotions,   dependent: :delete_all
  has_many :emotions,   through: :sutra_emotions, source: :theme

  # --- Scopes on normalized schema ---
  scope :by_theme,     ->(t) { joins(:sutra_themes).where(sutra_themes: { theme_id: Theme.where(name: t) }) }
  scope :by_virtue,    ->(v) { joins(:sutra_virtues).where(sutra_virtues: { theme_id: Theme.where(name: v) }) }
  scope :by_vice,      ->(v) { joins(:sutra_vices).where(sutra_vices: { theme_id: Theme.where(name: v) }) }
  scope :by_situation, ->(s) { joins(:sutra_situations).where(sutra_situations: { theme_id: Theme.where(name: s) }) }
  scope :by_emotion,   ->(e) { joins(:sutra_emotions).where(sutra_emotions: { theme_id: Theme.where(name: e) }) }

  # Generic OR-match scope across any metadata association
  def self.matching_any(arr, association)
    join_table = {
      themes:     :sutra_themes,
      virtues:    :sutra_virtues,
      vices:      :sutra_vices,
      situations: :sutra_situations,
      emotions:   :sutra_emotions
    }[association.to_sym]

    raise ArgumentError, "Invalid association: #{association}" unless join_table

    joins(join_table)
      .where(join_table => { theme_id: Theme.where(name: arr) })
      .distinct
  end

  validates :canonical_id,   presence: true, uniqueness: true
  validates :translation_en, presence: true
  validates :chapter,        presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 17 }
end
