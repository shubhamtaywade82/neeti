class MigrateArrayColumnsToJoinTables < ActiveRecord::Migration[8.1]
  def up
    # ------------------------------------------------------------------
    # Migrate sutra metadata arrays → join tables
    # ------------------------------------------------------------------

    execute <<-SQL.squish
      INSERT INTO sutra_themes (sutra_id, theme_id)
      SELECT s.id, t.id
      FROM sutras s
      CROSS JOIN LATERAL unnest(s.themes) AS theme_name
      INNER JOIN themes t ON t.name = theme_name
      WHERE s.themes IS NOT NULL AND array_length(s.themes, 1) > 0
      ON CONFLICT DO NOTHING
    SQL

    execute <<-SQL.squish
      INSERT INTO sutra_virtues (sutra_id, theme_id)
      SELECT s.id, t.id
      FROM sutras s
      CROSS JOIN LATERAL unnest(s.virtues) AS virtue_name
      INNER JOIN themes t ON t.name = virtue_name
      WHERE s.virtues IS NOT NULL AND array_length(s.virtues, 1) > 0
      ON CONFLICT DO NOTHING
    SQL

    execute <<-SQL.squish
      INSERT INTO sutra_vices (sutra_id, theme_id)
      SELECT s.id, t.id
      FROM sutras s
      CROSS JOIN LATERAL unnest(s.vices) AS vice_name
      INNER JOIN themes t ON t.name = vice_name
      WHERE s.vices IS NOT NULL AND array_length(s.vices, 1) > 0
      ON CONFLICT DO NOTHING
    SQL

    execute <<-SQL.squish
      INSERT INTO sutra_situations (sutra_id, theme_id)
      SELECT s.id, t.id
      FROM sutras s
      CROSS JOIN LATERAL unnest(s.situations) AS situation_name
      INNER JOIN themes t ON t.name = situation_name
      WHERE s.situations IS NOT NULL AND array_length(s.situations, 1) > 0
      ON CONFLICT DO NOTHING
    SQL

    execute <<-SQL.squish
      INSERT INTO sutra_emotions (sutra_id, theme_id)
      SELECT s.id, t.id
      FROM sutras s
      CROSS JOIN LATERAL unnest(s.emotions) AS emotion_name
      INNER JOIN themes t ON t.name = emotion_name
      WHERE s.emotions IS NOT NULL AND array_length(s.emotions, 1) > 0
      ON CONFLICT DO NOTHING
    SQL

    # ------------------------------------------------------------------
    # Migrate theme relationship arrays → theme_relationships
    # ------------------------------------------------------------------

    execute <<-SQL.squish
      INSERT INTO theme_relationships (source_theme_id, target_theme_id, relationship_type, weight, created_at, updated_at)
      SELECT st.id, tt.id, 'related', 1.0, NOW(), NOW()
      FROM themes st
      CROSS JOIN LATERAL unnest(st.related_theme_names) AS related_name
      INNER JOIN themes tt ON tt.name = related_name
      WHERE st.related_theme_names IS NOT NULL AND array_length(st.related_theme_names, 1) > 0
      ON CONFLICT DO NOTHING
    SQL
  end

  def down
    execute "DELETE FROM sutra_themes"
    execute "DELETE FROM sutra_virtues"
    execute "DELETE FROM sutra_vices"
    execute "DELETE FROM sutra_situations"
    execute "DELETE FROM sutra_emotions"
    execute "DELETE FROM theme_relationships"
  end
end
