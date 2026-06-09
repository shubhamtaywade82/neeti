class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.text    :email,             null: false
      t.text    :password_digest,   null: false
      t.text    :plan,              null: false, default: 'free'
      t.integer :daily_query_count, default: 0, null: false
      t.date    :daily_reset_at,    default: -> { 'CURRENT_DATE' }
      t.text    :razorpay_customer_id
      t.text    :razorpay_subscription_id
      t.timestamps
    end
    add_index :users, :email, unique: true
  end
end
