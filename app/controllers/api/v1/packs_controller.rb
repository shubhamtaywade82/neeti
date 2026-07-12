module Api
  module V1
    class PacksController < ApplicationController
      def index
        packs = KnowledgePack.all.order(:name).map do |pack|
          {
            id: pack.slug,
            name: pack.name,
            slug: pack.slug,
            emoji: pack.icon,
            author: pack.author,
            version: pack.version,
            tier: pack.tier,
            rating: 4.8,
            reviews: rand(400..2000),
            nodes: pack.node_count,
            edges: pack.edge_count,
            themes: pack.metadata&.dig('theme_count') || 20,
            color: pack.color,
            borderColor: hex_to_rgba(pack.color, 0.35),
            bgColor: hex_to_rgba(pack.color, 0.08),
            desc: pack.description,
            tags: pack.metadata&.dig('tags') || [],
            official: pack.official,
            premium: pack.premium
          }
        end

        installed = current_user.installed_packs || []
        render json: { packs: packs, installed: installed }
      end

      def install
        pack_id = params[:pack_id]
        installed = current_user.installed_packs || []
        unless installed.include?(pack_id)
          installed = installed.dup << pack_id
          current_user.update!(installed_packs: installed)
        end
        render json: { success: true, installed: installed }
      end

      def uninstall
        pack_id = params[:pack_id]
        installed = current_user.installed_packs || []
        if installed.include?(pack_id)
          installed = installed.dup
          installed.delete(pack_id)
          current_user.update!(installed_packs: installed)
        end
        render json: { success: true, installed: installed }
      end

      private

      def hex_to_rgba(hex, alpha)
        m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
        return "rgba(128,128,128,#{alpha})" unless m
        "rgba(#{m[1].to_i(16)},#{m[2].to_i(16)},#{m[3].to_i(16)},#{alpha})"
      end
    end
  end
end
