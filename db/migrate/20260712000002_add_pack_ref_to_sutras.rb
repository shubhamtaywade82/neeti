class AddPackRefToSutras < ActiveRecord::Migration[8.1]
  def change
    add_reference :sutras, :knowledge_pack, foreign_key: true, null: true
  end
end
