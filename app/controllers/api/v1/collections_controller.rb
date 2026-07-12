module Api
  module V1
    class CollectionsController < ApplicationController
      def index
        collections = current_user.collections.ordered.includes(:documents)
        render json: {
          collections: collections.map { |c| serialize_collection(c) }
        }
      end

      def show
        collection = current_user.collections.find(params[:id])
        render json: { collection: serialize_collection(collection) }
      end

      def create
        collection = current_user.collections.create!(collection_params)
        render json: { collection: serialize_collection(collection) }, status: :created
      end

      def update
        collection = current_user.collections.find(params[:id])
        collection.update!(collection_params)
        render json: { collection: serialize_collection(collection) }
      end

      def destroy
        collection = current_user.collections.find(params[:id])
        collection.destroy
        head :no_content
      end

      private

      def collection_params
        params.permit(:name, :description, :icon)
      end

      def serialize_collection(c)
        {
          id: c.id,
          name: c.name,
          description: c.description,
          icon: c.icon,
          slug: c.slug,
          document_count: c.documents.count,
          created_at: c.created_at
        }
      end
    end
  end
end
