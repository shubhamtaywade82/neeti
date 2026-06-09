class Theme < ApplicationRecord
  validates :name,     presence: true, uniqueness: true
  validates :category, inclusion: { in: %w[virtue vice situation emotion concept] },
                       allow_nil: true

  def self.expand_related(seed_names, depth: 2)
    return [] if seed_names.blank?

    sql = <<-SQL
      WITH RECURSIVE theme_graph AS (
        SELECT name, related_theme_names, 0 AS depth
        FROM themes WHERE name = ANY(ARRAY[:seeds]::text[])
        UNION ALL
        SELECT t.name, t.related_theme_names, tg.depth + 1
        FROM themes t
        JOIN theme_graph tg ON t.name = ANY(tg.related_theme_names)
        WHERE tg.depth < :max_depth
      )
      SELECT DISTINCT name FROM theme_graph
    SQL

    find_by_sql([sql, { seeds: seed_names, max_depth: depth }]).map(&:name)
  end
end
