# frozen_string_literal: true

module Api
  module V1
    class GraphController < ApplicationController
      def index
        themes = Theme.all
        relationships = ThemeRelationship.all

        nodes = themes.map do |t|
          # Get some sample sutras referencing this theme
          referencing_sutras = Sutra.by_theme(t.name).limit(5).map do |s|
            {
              id: s.id,
              canonical_id: s.canonical_id,
              translation_en: s.translation_en,
              chapter: s.chapter
            }
          end

          {
            id: t.id.to_s,
            name: t.name,
            category: t.category || "concept",
            sutras: referencing_sutras
          }
        end

        edges = relationships.map do |r|
          {
            source: r.source_theme_id.to_s,
            target: r.target_theme_id.to_s,
            type: r.relationship_type || "relates",
            strength: r.weight || 0.8
          }
        end

        render json: {
          nodes: nodes,
          edges: edges
        }
      end
    end
  end
end
