class Theme < ApplicationRecord
  has_many :outgoing_relationships, class_name: "ThemeRelationship", foreign_key: :source_theme_id, dependent: :destroy
  has_many :incoming_relationships, class_name: "ThemeRelationship", foreign_key: :target_theme_id, dependent: :destroy
  has_many :related_themes, through: :outgoing_relationships, source: :target_theme

  validates :name,     presence: true, uniqueness: true
  validates :category, inclusion: { in: %w[virtue vice situation emotion concept] },
                       allow_nil: true

  def self.expand_related(seed_names, depth: 2)
    return [] if seed_names.blank?

    sql = <<-SQL
      WITH RECURSIVE theme_graph AS (
        SELECT id, name, 0 AS depth
        FROM themes WHERE name = ANY(ARRAY[:seeds]::text[])
        UNION ALL
        SELECT t.id, t.name, tg.depth + 1
        FROM themes t
        INNER JOIN theme_relationships tr ON t.id = tr.target_theme_id
        INNER JOIN theme_graph tg ON tr.source_theme_id = tg.id
        WHERE tg.depth < :max_depth
      )
      SELECT DISTINCT name FROM theme_graph
    SQL

    find_by_sql([ sql, { seeds: seed_names, max_depth: depth } ]).map(&:name)
  end

  # Transition setter: store names to sync after save (parent id may be nil here)
  def related_theme_names=(values)
    if values.present? && values.all? { |v| v.is_a?(String) }
      write_attribute(:related_theme_names, values)
      @pending_relationship_names = values
    else
      super
    end
  end

  after_save :sync_relationships!

  private

  def sync_relationships!
    return unless @pending_relationship_names

    outgoing_relationships.delete_all
    @pending_relationship_names.each do |name|
      target = Theme.find_by(name: name)
      outgoing_relationships.create!(target_theme: target) if target
    end
    @pending_relationship_names = nil
  end
end
