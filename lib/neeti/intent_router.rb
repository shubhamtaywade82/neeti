# lib/neeti/intent_router.rb
module Neeti
  class IntentRouter
    CATEGORIES = %i[self_harm abuse minors medical legal sexual_violence].freeze

    # Priority when multiple fire. Order matters.
    PRIORITY = %i[self_harm sexual_violence minors abuse medical legal].freeze

    # Stage 1: deliberately over-broad. A false positive costs a user 15 seconds.
    # A false negative is unacceptable. Expand from real logs; never contract
    # without eval-set evidence.
    # NOTE: these patterns use /x (extended mode), which makes literal
    # whitespace insignificant. Every inter-word space in a phrase must be
    # written as \s+ or it silently never matches (e.g. "kill(ing)? myself"
    # would match "kill(ing)?myself", not the real phrase with a space).
    PATTERNS = {
      self_harm: /\b(suicid\w*|kill(ing)?\s+myself|end(ing)?\s+my\s+life|take\s+my\s+own\s+life|
                   self.?harm|hurt(ing)?\s+myself|cut(ting)?\s+myself|want\s+to\s+die|
                   don'?t\s+want\s+to\s+(be\s+here|live)|no\s+reason\s+to\s+live|better\s+off\s+dead|
                   overdos\w*)\b/xi,

      abuse: /\b(hits?\s+me|hit(ting)?\s+me|beats?\s+me|beat(ing|s)?\s+(me|her|him)|
               abus(e|es|ive|ing)|assault\w*|threaten(s|ed|ing)\s+(me|to\s+kill)|
               scared\s+(of|for)\s+my\s+(husband|wife|partner|father|mother|boyfriend|girlfriend)|
               won'?t\s+let\s+me\s+leave|controls?\s+(everything|me|my)|
               gets?\s+violent|throws?\s+things\s+at\s+me|marital\s+rape|dowry\s+harass\w*)\b/xi,

      minors: /\b(my\s+(son|daughter|child|kid|nephew|niece)|a\s+(child|minor|student))\b
               .{0,80}
               \b(abus\w*|hurt|hit|beat|touch\w*|inappropriat\w*|groom\w*|
                  harass\w*|bull(y|ied|ying)|self.?harm|suicid\w*)\b/xim,

      medical: /\b(diagnos\w*|prescri\w*|dosage|mg\s+of|symptom\w*|chest\s+pain|
                 can'?t\s+breathe|seizure|stroke|bleeding|pregnan\w*|
                 psychiatri\w*|bipolar|schizophren\w*|panic\s+attack\w*|
                 antidepress\w*|stop(ping)?\s+my\s+medication)\b/xi,

      legal: /\b(lawsuit|suing|sue\s+(him|her|them|my)|court\s+(case|date|hearing)|
               police\s+(report|complaint|case)|FIR\b|arrest\w*|bail|
               legal\s+(action|notice|proceeding)|custody\s+battle|divorce\s+(petition|proceeding))\b/xi,

      sexual_violence: /\b(rap(e|ed|ing)|sexual(ly)?\s+(assault\w*|abus\w*|harass\w*)|
                        molested|forced\s+me\s+to|without\s+my\s+consent)\b/xi
    }.freeze

    Verdict = Struct.new(:routed?, :category, :categories, :stage, keyword_init: true)

    def initialize(query, session_elevated: false, logger: Rails.logger)
      @query = query.to_s
      @elevated = session_elevated
      @logger = logger
    end

    def call
      lexical = lexical_match
      return verdict(lexical, :lexical) if lexical.any?

      # Stage 2 runs on EVERY query that clears Stage 1 — not only on suspicious ones.
      # Lexical patterns cannot enumerate natural language; the classifier is the
      # real gate and the regex is a fast path.
      classified = classifier_match
      return verdict(classified, :classifier) if classified.any?

      Verdict.new(routed?: false, category: nil, categories: [], stage: nil)
    end

    private

    def lexical_match
      PATTERNS.select { |_, pattern| pattern.match?(@query) }.keys
    end

    def classifier_match
      result = ::SafetyClassifier.new(@query, elevated: @elevated).call
      result.categories
    rescue StandardError => e
      # FAIL CLOSED. An unavailable classifier means we cannot establish safety,
      # so we route. A user with a career question sees a resource card. Acceptable.
      @logger.error(event: "intent_router.classifier_failed", error: e.class.name)
      [:medical]  # generic "needs a human" bucket
    end

    def verdict(categories, stage)
      primary = PRIORITY.find { |c| categories.include?(c) } || categories.first
      Verdict.new(routed?: true, category: primary, categories: categories, stage: stage)
    end
  end
end
