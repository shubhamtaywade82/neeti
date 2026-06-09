class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.text   :role,             null: false
      t.text   :content,          null: false
      t.bigint :cited_sutra_ids,  array: true, default: []
      t.integer :tokens_used
      t.timestamps
    end
    add_index :messages, :role
  end
end
