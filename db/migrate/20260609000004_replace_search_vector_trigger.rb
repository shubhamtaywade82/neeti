class ReplaceSearchVectorTrigger < ActiveRecord::Migration[8.1]
  def up
    execute <<-SQL
      CREATE OR REPLACE FUNCTION sutras_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.translation_en, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.transliteration, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(
            (SELECT string_agg(themes.name, ' ')
             FROM sutra_themes st
             INNER JOIN themes ON themes.id = st.theme_id
             WHERE st.sutra_id = NEW.id),
            ''
          )), 'C') ||
          setweight(to_tsvector('english', coalesce(
            (SELECT string_agg(themes.name, ' ')
             FROM sutra_situations ss
             INNER JOIN themes ON themes.id = ss.theme_id
             WHERE ss.sutra_id = NEW.id),
            ''
          )), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    SQL
  end

  def down
    execute <<-SQL
      CREATE OR REPLACE FUNCTION sutras_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.translation_en, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.transliteration, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.themes, ' '), '')), 'C') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.situations, ' '), '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    SQL
  end
end
