# db/migrate/20260808000001_add_ruby_llm_tables.rb
class AddRubyLlmTables < ActiveRecord::Migration[8.1]
  def change
    # Add thinking and cost tracking columns to messages table
    add_column :messages, :thinking_text, :text
    add_column :messages, :thinking_tokens, :integer
    add_column :messages, :output_tokens, :integer
    add_column :messages, :input_tokens, :integer
    add_column :messages, :total_cost, :decimal, precision: 15, scale: 6
    add_column :messages, :thinking_cost, :decimal, precision: 15, scale: 6
    
    # Create chats table for ruby_llm agent persistence
    create_table :chats do |t|
      t.references :user, null: false, foreign_key: true
      t.string :agent_type, null: false
      t.string :title
      t.text :metadata
      t.integer :message_count, default: 0
      t.decimal :total_cost, precision: 15, scale: 6, default: 0.0
      
      t.timestamps
    end
    
    add_index :chats, :agent_type
    add_index :chats, [:user_id, :created_at]
    
    # Create tool_calls table for auditing
    create_table :tool_calls do |t|
      t.references :chat, null: false, foreign_key: true
      t.references :message, null: false, foreign_key: true
      t.string :tool_name, null: false
      t.jsonb :arguments
      t.jsonb :result
      t.boolean :success, default: true
      t.text :error_message
      t.integer :execution_time_ms
      
      t.timestamps
    end
    
    add_index :tool_calls, :tool_name
    add_index :tool_calls, [:chat_id, :created_at]
    
    # Update existing messages relation to point to chats instead of conversations
    # (Optional: if you want to use the new Chat model from ruby_llm)
    add_reference :messages, :chat, foreign_key: true, index: true
  end
end
