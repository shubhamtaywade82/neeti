class CreateConsultationsAndCredits < ActiveRecord::Migration[8.0]
  def change
    # Migration 3: Consultation tracking and credit ledger
    
    # Consultations table - durable consultation objects
    create_table :consultations do |t|
      t.references :user, null: false, foreign_key: true
      t.references :conversation, null: false, foreign_key: true
      t.string :title, null: false
      t.text :situation, null: false  # Multi-line "What's the situation?" field
      t.text :advice_summary
      t.string :advisor, null: false, default: 'chanakya'
      t.integer :credit_cost, null: false, default: 1
      t.string :status, null: false, default: 'completed'  # pending, completed, archived
      t.datetime :completed_at
      t.string :permalink_token  # For shareable links
      
      t.timestamps
    end
    
    add_index :consultations, :permalink_token, unique: true
    add_index :consultations, [:user_id, :created_at]
    
    # Citations table - track which sutras were cited in each consultation
    create_table :citations do |t|
      t.references :consultation, null: false, foreign_key: true
      t.references :sutra, null: false, foreign_key: true
      t.integer :position  # Order of citation in the response
      
      t.timestamps
    end
    
    add_index :citations, [:consultation_id, :position]
    
    # Retrieval candidates table - log what was retrieved (for eval/auditing)
    create_table :retrieval_candidates do |t|
      t.references :consultation, null: false, foreign_key: true
      t.references :sutra, null: true
      t.references :document_chunk, null: true
      t.string :channel, null: false  # metadata, fts, llm, graph, embedding, user_docs
      t.integer :rank_position
      t.float :rrf_score
      
      t.timestamps
    end
    
    add_index :retrieval_candidates, [:consultation_id, :channel]
    
    # Safety events table - log crisis detections and safety interventions
    create_table :safety_events do |t|
      t.references :user, null: false, foreign_key: true
      t.references :consultation, null: true, foreign_key: true
      t.string :event_type, null: false  # crisis_detected, hallucination_blocked, excluded_sutra_attempted
      t.text :query_snapshot
      t.text :metadata  # JSON with details
      
      t.timestamps
    end
    
    add_index :safety_events, :event_type
    
    # Credit ledger entries table - track all credit transactions
    create_table :credit_ledger_entries do |t|
      t.references :user, null: false, foreign_key: true
      t.references :consultation, null: true, foreign_key: true
      t.integer :amount, null: false  # Positive for credits added, negative for spent
      t.string :transaction_type, null: false  # daily_grant, purchase, consultation_spend, refund
      t.string :description
      t.integer :balance_after, null: false  # Running balance
      
      t.timestamps
    end
    
    add_index :credit_ledger_entries, [:user_id, :created_at]
    
    # Add token_version to users (for JWT invalidation on subscription changes)
    add_column :users, :token_version, :integer, null: false, default: 0
    
    # Migrate billing model: remove daily_query_count, add credit_balance
    add_column :users, :credit_balance, :integer, null: false, default: 2  # Free tier starts with 2
    add_column :users, :last_credit_reset, :date  # Track when daily grant was last given
    
    # Note: We keep daily_query_count temporarily for backward compatibility during migration
    # It will be removed in a future migration once all clients are updated
  end
end
