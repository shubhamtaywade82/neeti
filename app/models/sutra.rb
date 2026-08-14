class Sutra < ApplicationRecord
  include PgSearch::Model

  belongs_to :knowledge_pack, optional: true

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

  # --- Transition helpers: array columns still exist in DB (step-6 will drop them) ---
  # When assigned string arrays, write to both the array column AND the join table.
  %w[themes virtues vices situations emotions].each do |attr|
    define_method("#{attr}=") do |values|
      if values.present? && values.all? { |v| v.is_a?(String) }
        write_attribute(attr, values)
        assoc = attr.to_sym
        join_assoc = {
          themes: :sutra_themes, virtues: :sutra_virtues, vices: :sutra_vices,
          situations: :sutra_situations, emotions: :sutra_emotions
        }[assoc]
        send(join_assoc).delete_all
        themes = values.map { |name| Theme.find_or_create_by!(name: name) { |t| t.category ||= 'concept' } }
        themes.each { |t| send(join_assoc).build(theme: t) }
      else
        super(values)
      end
    end
  end

  after_save :rebuild_search_vector_from_joins!

  validates :canonical_id,   presence: true, uniqueness: true
  validates :translation_en, presence: true
  validates :chapter,        presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }

  def canonical_reference = canonical_id
  def sanskrit_text = sanskrit

  # --- Advisory status enum for safety curation ---
  # pending: 0 - not yet reviewed, EXCLUDED from retrieval by default
  # active: 1 - safe for general advice, unrestricted
  # contextual: 2 - requires historical framing wrapper before display
  # excluded: 3 - never retrievable; kept for scholarly completeness
  enum :advisory_status, {
    pending: 0,
    active: 1,
    contextual: 2,
    excluded: 3
  }

  # THE SAFETY SCOPE. Every retrieval channel must pass through this.
  # A channel that constructs its own base relation is a defect.
  scope :retrievable, -> { where(advisory_status: [:active, :contextual]) }

  validates :advisory_status, presence: true
  validate :curation_complete_when_decided

  private

  # Rebuild search_vector after join records are saved, since the DB trigger
  # fires BEFORE insert when the join rows do not yet exist.
  def rebuild_search_vector_from_joins!
    themes_agg     = aggregate_theme_names(:sutra_themes)
    situations_agg = aggregate_theme_names(:sutra_situations)
    return unless themes_agg || situations_agg

    sql = ActiveRecord::Base.sanitize_sql_array([
      "UPDATE sutras SET search_vector =
         setweight(to_tsvector('english', COALESCE(?, '')), 'A') ||
         setweight(to_tsvector('english', COALESCE(?, '')), 'B') ||
         setweight(to_tsvector('english', COALESCE(?, '')), 'C') ||
         setweight(to_tsvector('english', COALESCE(?, '')), 'C')
       WHERE id = ?",
      translation_en || '',
      transliteration || '',
      themes_agg || '',
      situations_agg || '',
      id
    ])

    ActiveRecord::Base.connection.execute(sql)
  end

  def aggregate_theme_names(join_table)
    result = ActiveRecord::Base.connection.execute(
      ActiveRecord::Base.sanitize_sql_array([
        "SELECT STRING_AGG(themes.name, ' ') FROM #{join_table} st INNER JOIN themes ON themes.id = st.theme_id WHERE st.sutra_id = ?",
        id
      ])
    )
    result.first.values.first
  end

  def curation_complete_when_decided
    return if pending?

    if curated_by.blank?
      errors.add(:curated_by, "must be set when changing from pending status")
    end
    if curated_at.blank?
      errors.add(:curated_at, "must be set when changing from pending status")
    end
  end
end
