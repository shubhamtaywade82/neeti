class AddAdvisorToConversations < ActiveRecord::Migration[8.1]
  def change
    add_column :conversations, :advisor, :string, default: 'chanakya', null: false
  end
end
