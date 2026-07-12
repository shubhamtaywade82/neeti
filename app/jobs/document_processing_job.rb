class DocumentProcessingJob < ApplicationJob
  queue_as :default

  CHUNK_SIZE = 512
  CHUNK_OVERLAP = 128
  EMBEDDING_MODEL = 'nomic-embed-text'

  def perform(document_id)
    doc = Document.find(document_id)
    doc.update!(status: 'processing')

    text = extract_text(doc)
    return doc.update!(status: 'error', error_message: 'No text could be extracted') if text.blank?

    chunks = chunk_text(text)
    return doc.update!(status: 'error', error_message: 'Text too short after chunking') if chunks.empty?

    doc.update!(
      token_count: estimate_tokens(text),
      chunk_count: chunks.size
    )

    embeddings = generate_embeddings(chunks)

    chunks.each_with_index do |content, i|
      doc.chunks.create!(
        content: content,
        position: i,
        token_count: estimate_tokens(content),
        embedding: embeddings[i] || []
      )
    end

    doc.update!(status: 'ready')
  rescue => e
    doc.update!(status: 'error', error_message: e.message)
    Rails.logger.error("DocumentProcessingJob(#{document_id}): #{e.class}: #{e.message}")
  end

  private

  def extract_text(doc)
    case doc.file_type
    when 'pdf'
      extract_pdf(doc.storage_key)
    when 'md', 'txt'
      File.read(doc.storage_key)
    when 'docx'
      extract_docx(doc.storage_key)
    else
      File.read(doc.storage_key)
    end
  rescue => e
    Rails.logger.error("Extract text failed for #{doc.id}: #{e.message}")
    nil
  end

  def extract_pdf(path)
    reader = PDF::Reader.new(path)
    reader.pages.map.with_index { |page, i| "[Page #{i + 1}]\n#{page.text}" }.join("\n\n")
  rescue => e
    Rails.logger.error("PDF extraction error: #{e.message}")
    nil
  end

  def extract_docx(path)
    doc = Docx::Document.open(path)
    doc.paragraphs.map(&:text).join("\n")
  rescue => e
    Rails.logger.error("DOCX extraction error: #{e.message}")
    nil
  end

  def chunk_text(text)
    words = text.split(/\s+/)
    chunks = []
    i = 0

    while i < words.length
      chunk_words = words[i, CHUNK_SIZE]
      break if chunk_words.empty?
      chunks << chunk_words.join(' ')
      i += CHUNK_SIZE - CHUNK_OVERLAP
    end

    chunks
  end

  def generate_embeddings(chunks)
    return [] if chunks.empty?

    require 'net/http'
    require 'json'
    require 'uri'

    uri = URI.parse("#{ENV.fetch('OLLAMA_URL', 'http://localhost:11434')}/api/embed")
    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = 30
    http.read_timeout = 120

    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = {
      model: EMBEDDING_MODEL,
      input: chunks
    }.to_json

    response = http.request(request)

    if response.code.to_i == 200
      data = JSON.parse(response.body)
      data['embeddings'] || []
    else
      Rails.logger.error("Embedding API error: #{response.code} #{response.body}")
      chunks.map { |_| [] }
    end
  rescue => e
    Rails.logger.error("Embedding generation error: #{e.message}")
    chunks.map { |_| [] }
  end

  def estimate_tokens(text)
    (text.split.length * 1.3).round
  end
end
