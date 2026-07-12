module Api
  module V1
    class DocumentsController < ApplicationController
      def index
        docs = current_user.documents.recent.includes(:collection)
        docs = docs.where(collection_id: params[:collection_id]) if params[:collection_id]
        docs = docs.where(file_type: params[:type]) if params[:type]
        docs = docs.where(status: params[:status]) if params[:status]

        render json: {
          documents: docs.map { |d| serialize_document(d) }
        }
      end

      def show
        doc = current_user.documents.find(params[:id])
        render json: { document: serialize_document(doc) }
      end

      def create
        file = params[:file]
        return render json: { error: 'No file provided' }, status: :bad_request unless file

        if file.size > 20.megabytes
          return render json: { error: 'File too large (max 20MB)' }, status: :unprocessable_entity
        end

        original_name = file.original_filename.presence
        return render json: { error: 'File has no name' }, status: :bad_request unless original_name

        ext = File.extname(original_name).downcase.delete('.')
        return render json: { error: "Unsupported file type: .#{ext}" }, status: :unprocessable_entity unless %w[pdf md txt docx].include?(ext)

        allowed_mimes = {
          'pdf' => 'application/pdf',
          'md'  => 'text/markdown',
          'txt' => 'text/plain',
          'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        actual_type = Marcel::MimeType.for(file)
        expected = allowed_mimes[ext]
        if expected && actual_type != expected
          return render json: { error: 'File content does not match its extension.' }, status: :unprocessable_entity
        end

        doc = current_user.documents.create!(
          filename: file.original_filename,
          title: params[:title] || file.original_filename,
          file_type: ext,
          file_size: file.size,
          storage_key: store_file(file),
          collection_id: params[:collection_id],
          status: 'pending'
        )

        DocumentProcessingJob.perform_later(doc.id)

        render json: { document: serialize_document(doc) }, status: :created
      end

      def destroy
        doc = current_user.documents.find(params[:id])
        doc.destroy
        head :no_content
      end

      def update
        doc = current_user.documents.find(params[:id])
        doc.update!(title: params[:title]) if params[:title]
        doc.update!(collection_id: params[:collection_id]) if params.key?(:collection_id)
        render json: { document: serialize_document(doc) }
      end

      private

      def store_file(file)
        dir = Rails.root.join('storage', 'uploads', Time.now.strftime('%Y/%m/%d'))
        FileUtils.mkdir_p(dir)
        safe_name = "#{SecureRandom.hex(8)}_#{File.basename(file.original_filename)}"
        path = dir.join(safe_name)
        File.open(path, 'wb') { |f| f.write(file.read) }
        path.to_s
      end

      def serialize_document(doc)
        {
          id: doc.id,
          filename: doc.filename,
          title: doc.title,
          file_type: doc.file_type,
          file_size: doc.file_size,
          page_count: doc.page_count,
          chunk_count: doc.chunk_count,
          token_count: doc.token_count,
          status: doc.status,
          collection_id: doc.collection_id,
          collection_name: doc.collection&.name,
          created_at: doc.created_at,
          updated_at: doc.updated_at
        }
      end
    end
  end
end
