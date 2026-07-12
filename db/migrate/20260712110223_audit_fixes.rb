class AuditFixes < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :token_version, :integer, default: 0, null: false
    remove_index :users, :reset_token if index_exists?(:users, :reset_token)
    add_index :users, :reset_token, unique: true
    change_column_null :users, :daily_reset_at, false
  end
end
