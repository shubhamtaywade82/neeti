class ThemeRelationship < ApplicationRecord
  belongs_to :source_theme, class_name: "Theme"
  belongs_to :target_theme, class_name: "Theme"

  validates :source_theme_id, uniqueness: { scope: [ :target_theme_id, :relationship_type ] }
  validates :relationship_type, presence: true
end
