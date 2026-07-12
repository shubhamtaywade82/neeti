class AddPasswordResetToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :reset_token, :string
    add_index :users, :reset_token
    add_column :users, :reset_sent_at, :datetime
  end
end
