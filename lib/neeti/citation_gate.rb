# lib/neeti/citation_gate.rb
module Neeti
  class CitationGate
    # Pattern to match [[S:nnn]] markers in streaming text
    CITATION_PATTERN = /\[\[S:(\d+)\]\]/
    
    def initialize(retrieved_sutra_ids:, user_document_ids: [])
      @allowed_sutra_ids = Array(retrieved_sutra_ids).map { |s| s.respond_to?(:id) ? s.id : s }.map(&:to_i).to_set
      @allowed_doc_ids = Array(user_document_ids).map { |d| d.respond_to?(:id) ? d.id : d }.map(&:to_i).to_set
      @dropped_citations = []
    end
    
    attr_reader :dropped_citations
    
    # Process a single token/chunk of text, filtering out invalid citations
    # Returns the filtered text with hallucinated citations removed
    def process(text)
      return text if text.blank?
      
      text.gsub(CITATION_PATTERN) do |match|
        sutra_id = $1.to_i
        
        if @allowed_sutra_ids.include?(sutra_id)
          match  # Keep valid citation
        else
          @dropped_citations << sutra_id
          ''   # Drop hallucinated citation
        end
      end
    end
    
    # Validate all citations in a complete text
    # Returns { valid: [], invalid: [] }
    def validate(text)
      found_ids = text.scan(CITATION_PATTERN).map { |m| m[0].to_i }
      
      {
        valid: found_ids.select { |id| @allowed_sutra_ids.include?(id) },
        invalid: found_ids.reject { |id| @allowed_sutra_ids.include?(id) }
      }
    end
    
    # Check if text contains any hallucinated citations
    def hallucinated?(text)
      result = validate(text)
      result[:invalid].any?
    end
  end
  
  # Stream parser that intercepts tokens and filters citations in real-time
  class MarkerStreamParser
    def initialize(stream_proc:, citation_gate:)
      @stream_proc = stream_proc
      @citation_gate = citation_gate
      @buffer = ''
      @pending_citation = nil
    end
    
    # Process a token from the LLM stream
    # Filters out hallucinated citations before emitting to client
    def write_token(token)
      @buffer += token
      
      # Check if buffer contains complete or partial citation markers
      if @buffer.include?('[[S:')
        # Try to extract complete citations
        complete_text, pending = extract_complete_citations(@buffer)
        
        # Process complete text through citation gate
        filtered = @citation_gate.process(complete_text)
        @stream_proc.call(filtered) if filtered.present?
        
        # Keep incomplete citation in buffer
        @buffer = pending
      else
        # No citation in progress, emit accumulated buffer (may include text
        # carried over from a prior partial-citation extraction)
        @stream_proc.call(@buffer)
        @buffer = ''
      end
    rescue => e
      Rails.logger.error("MarkerStreamParser error: #{e.message}")
      @stream_proc.call(token)  # Fail open - emit original token
      @buffer = ''
    end
    
    # Flush any remaining buffered content at stream end
    def flush
      return if @buffer.blank?
      
      filtered = @citation_gate.process(@buffer)
      @stream_proc.call(filtered) if filtered.present?
      @buffer = ''
    end
    
    private
    
    # Extract complete [[S:nnn]] markers from text, leaving partial markers
    # Returns [complete_text, pending_text]
    def extract_complete_citations(buffer)
      # Find all complete citations
      complete_pattern = /\[\[S:\d+\]\]/
      complete_matches = buffer.scan(complete_pattern)
      
      if complete_matches.any?
        # Find where the last complete citation ends
        last_match = buffer.match(/.*\[\[S:\d+\]\]/m)
        if last_match
          complete_text = last_match[0]
          pending = buffer.sub(complete_text, '')
          return [complete_text, pending]
        end
      end
      
      # No complete citations yet, check for partial
      if buffer =~ /\[\[S:\d*$/
        # Partial citation at end of buffer
        return ['', buffer]
      elsif buffer =~ /\[\[S:/
        # Has start of citation but might be incomplete
        return ['', buffer]
      end
      
      # No citations at all
      [buffer, '']
    end
  end
end
