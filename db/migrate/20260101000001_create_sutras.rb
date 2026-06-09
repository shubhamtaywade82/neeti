class CreateSutras < ActiveRecord::Migration[8.1]
  def change
    create_table :sutras do |t|
      t.text    :canonical_id,    null: false
      t.text    :sanskrit
      t.text    :transliteration
      t.text    :translation_en,  null: false
      t.text    :translation_hi
      t.integer :chapter,         null: false
      t.text    :chapter_title
      t.text    :themes,          array: true, default: []
      t.text    :virtues,         array: true, default: []
      t.text    :vices,           array: true, default: []
      t.text    :situations,      array: true, default: []
      t.text    :emotions,        array: true, default: []
      t.column  :search_vector,   :tsvector
      t.text    :source_url
      t.timestamps
    end

    add_index :sutras, :canonical_id, unique: true
    add_index :sutras, :chapter
    add_index :sutras, :themes,     using: :gin
    add_index :sutras, :virtues,    using: :gin
    add_index :sutras, :vices,      using: :gin
    add_index :sutras, :situations, using: :gin
    add_index :sutras, :emotions,   using: :gin
    add_index :sutras, :search_vector, using: :gin

    execute <<-SQL
      CREATE FUNCTION sutras_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.translation_en, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.transliteration, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.themes, ' '), '')), 'C') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.situations, ' '), '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER sutras_search_vector_trigger
        BEFORE INSERT OR UPDATE ON sutras
        FOR EACH ROW EXECUTE FUNCTION sutras_search_vector_update();
    SQL
  end
end
