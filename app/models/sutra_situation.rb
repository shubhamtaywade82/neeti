class SutraSituation < ApplicationRecord
  self.primary_key = nil
  self.implicit_order_column = "sutra_id"

  belongs_to :sutra
  belongs_to :theme
end
