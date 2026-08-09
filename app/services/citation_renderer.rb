# app/services/citation_renderer.rb
class CitationRenderer
  CONTEXTUAL_WRAPPER = <<~TEXT.strip
    This verse comes from a text written for rulers in the 4th century BCE.
    Its social framing reflects that period. It is cited here for the strategic
    principle it contains, not as guidance on social relations.
  TEXT

  def initialize(consultation, sutra_ids, sutras_by_id)
    @consultation = consultation
    @sutra_ids = sutra_ids
    @sutras = sutras_by_id
  end

  def call
    @sutra_ids.each_with_index.map do |id, idx|
      sutra = @sutras.fetch(id)

      # Defence in depth: even post-gate, assert the safety status.
      unless sutra.advisory_status_active? || sutra.advisory_status_contextual?
        raise "Non-retrievable sutra #{id} reached rendering — investigate immediately"
      end

      {
        position: idx + 1,
        sutra_id: sutra.id,
        reference: sutra.canonical_reference,
        sanskrit: sutra.sanskrit_text,
        transliteration: sutra.transliteration,
        translation: sutra.translation_en,
        # Applied in CODE. The model has no say in whether the wrapper appears.
        historical_framing: sutra.advisory_status_contextual? ? CONTEXTUAL_WRAPPER : nil
      }
    end
  end
end
