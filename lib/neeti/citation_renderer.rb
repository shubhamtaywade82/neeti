# lib/neeti/citation_renderer.rb
# Applies mandatory historical framing wrapper to all citations

module Neeti
  class CitationRenderer
    WRAPPER_TEMPLATE = <<~WRAPPER.strip
      📜 Historical Context: This wisdom from Chanakya Niti (c. 300 BCE) reflects ancient Indian statecraft and ethics. 
      While timeless in principle, apply it thoughtfully to modern situations. The text emerged from a specific historical 
      context—Mauryan Empire administration—and may use language or examples that don't directly translate to contemporary life.
      
      %{citation_text}
      
      — Chanakya (Kautilya), Arthashastra & Niti Shastra tradition
    WRAPPER
    
    attr_reader :citation
    
    def initialize(citation)
      @citation = citation
    end
    
    def render
      formatted_citation = format_citation
      WRAPPER_TEMPLATE % { citation_text: formatted_citation }
    end
    
    def self.render_multiple(citations)
      return "" if citations.blank?
      
      citations.map { |c| new(c).render }.join("\n\n")
    end
    
    private
    
    def format_citation
      sutra = citation.sutra
      parts = []
      
      # Sanskrit (if available)
      parts << "संस्कृत: #{sutra.sanskrit}" if sutra.sanskrit.present?
      
      # Translation
      parts << "Translation: #{sutra.translation_en}" if sutra.translation_en.present?
      
      # Canonical reference
      parts << "Reference: #{sutra.canonical_reference}" if sutra.canonical_reference.present?
      
      # Themes (for active/contextual sutras)
      if sutra.themes.present? && sutra.advisory_status != "excluded"
        theme_names = sutra.themes.map { |t| Theme.find_by(id: t["theme_id"])&.name }.compact
        parts << "Themes: #{theme_names.join(", ")}" if theme_names.any?
      end
      
      parts.join(" | ")
    end
  end
end
