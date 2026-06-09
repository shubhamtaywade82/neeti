class CreateUserInsights < ActiveRecord::Migration[8.1]
  def up
    create_table :user_insights do |t|
      t.references :user, null: false, foreign_key: true
      t.text   :insight_type
      t.text   :content, null: false
      t.column :search_vector, :tsvector
      t.timestamps
    end
    add_index :user_insights, :search_vector, using: :gin

    execute <<-SQL
      CREATE FUNCTION user_insights_sv_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER user_insights_sv_trigger
        BEFORE INSERT OR UPDATE ON user_insights
        FOR EACH ROW EXECUTE FUNCTION user_insights_sv_update();
    SQL
  end

  def down
    execute <<-SQL
      DROP TRIGGER IF EXISTS user_insights_sv_trigger ON user_insights;
      DROP FUNCTION IF EXISTS user_insights_sv_update();
    SQL
    drop_table :user_insights
  end
end
