class CreateConsultationsAndCredits < ActiveRecord::Migration[8.0]
  def change
    # Consultations table - durable consultation objects (replacing chat)
    create_table :consultations do |t|
      t.references :user, null: false, foreign_key: true
      t.references :parent, foreign_key: { to_table: :consultations }
      t.string :public_id, null: false
      t.text :query_text  # encrypted; NULL when routed
      t.string :title
      t.integer :status, null: false, default: 0
      t.string :routed_category
      t.string :detection_stage
      t.text :response_text  # encrypted
      t.integer :retrieval_ms
      t.integer :generation_ms
      t.string :model_used
      t.string :corpus_version
      t.integer :citations_proposed, null: false, default: 0
      t.integer :gate_violations, null: false, default: 0
      t.integer :credits_consumed, null: false, default: 0
      t.integer :user_reaction
      t.timestamps

      t.index :public_id, unique: true
      t.index [ :user_id, :created_at ]
      t.index :status
    end

    # Citations table - track which sutras were cited in each consultation
    create_table :citations do |t|
      t.references :consultation, null: false, foreign_key: true
      t.references :sutra, null: false, foreign_key: true  # NOT NULL: the guarantee
      t.integer :position, null: false
      t.integer :relevance_rank
      t.text :applied_interpretation
      t.timestamps

      t.index [ :consultation_id, :sutra_id ], unique: true
      t.index [ :consultation_id, :position ], unique: true
    end

    # Retrieval candidates table - log what was retrieved (for eval/auditing)
    create_table :retrieval_candidates do |t|
      t.references :consultation, null: false, foreign_key: true
      t.references :sutra, null: false, foreign_key: true
      t.jsonb :channel_ranks, null: false, default: {}
      t.float :fused_score, null: false
      t.integer :final_rank, null: false
      t.boolean :was_cited, null: false, default: false
      t.datetime :created_at, null: false

      t.index [ :consultation_id, :final_rank ]
      t.index :created_at  # purge job
    end

    # Safety events table - log crisis detections and safety interventions
    # NO query text column. Deliberate and permanent.
    create_table :safety_events do |t|
      t.references :user, null: false, foreign_key: true
      t.string :category, null: false
      t.string :detection_stage, null: false
      t.datetime :occurred_at, null: false

      t.index [ :user_id, :occurred_at ]
    end

    # Credit ledger entries table - track all credit transactions
    create_table :credit_ledger_entries do |t|
      t.references :user, null: false, foreign_key: true
      t.references :consultation, foreign_key: true
      t.integer :amount, null: false
      t.integer :transaction_type, null: false
      t.string :description
      t.integer :balance_after, null: false
      t.string :idempotency_key
      t.datetime :created_at, null: false

      t.index [ :user_id, :id ]
      t.index :idempotency_key, unique: true, where: "idempotency_key IS NOT NULL"
    end

    # Note: token_version was already added to users by 20260712110223_audit_fixes.rb

    # Migrate billing model: remove daily_query_count, add credit_balance
    add_column :users, :credit_balance, :integer, null: false, default: 2  # Free tier starts with 2
    add_column :users, :last_credit_reset, :date  # Track when daily grant was last given

    # Note: We keep daily_query_count temporarily for backward compatibility during migration
    # It will be removed in a future migration once all clients are updated
  end
end
