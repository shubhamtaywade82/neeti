# lib/neeti/intent_router.rb
module Neeti
  class IntentRouter
    CATEGORIES = %i[self_harm abuse minors medical legal sexual_violence].freeze
    
    # Priority when multiple fire. Order matters.
    PRIORITY = %i[self_harm sexual_violence minors abuse medical legal].freeze

    # Stage 1: deliberately over-broad. A false positive costs a user 15 seconds.
    # A false negative is unacceptable. Expand from real logs; never contract
    # without eval-set evidence.
    PATTERNS = {
      self_harm: /\b(suicid\w*|kill(ing)? myself|end(ing)? my life|take my own life|
                   self.?harm|hurt(ing)? myself|cut(ting)? myself|want to die|
                   don'?t want to (be here|live)|no reason to live|better off dead|
                   overdos\w*)\b/xi,
      
      abuse: /\b(hits? me|hit(ting)? me|beats? me|beat(ing|s)? (me|her|him)|
               abus(e|es|ive|ing)|assault\w*|threaten(s|ed|ing) (me|to kill)|
               scared (of|for) my (husband|wife|partner|father|mother|boyfriend|girlfriend)|
               won'?t let me leave|controls? (everything|me|my)|
               gets? violent|throws? things at me|marital rape|dowry harass\w*)\b/xi,
      
      minors: /\b(my (son|daughter|child|kid|nephew|niece)|a (child|minor|student))\b
               .{0,80}
               \b(abus\w*|hurt|hit|beat|touch\w*|inappropriat\w*|groom\w*|
                  harass\w*|bull(y|ied|ying)|self.?harm|suicid\w*)\b/xim,
      
      medical: /\b(diagnos\w*|prescri\w*|dosage|mg of|symptom\w*|chest pain|
                 can'?t breathe|seizure|stroke|bleeding|pregnan\w*|
                 psychiatri\w*|bipolar|schizophren\w*|panic attack\w*|
                 antidepress\w*|stop(ping)? my medication)\b/xi,
      
      legal: /\b(lawsuit|suing|sue (him|her|them|my)|court (case|date|hearing)|
               police (report|complaint|case)|FIR\b|arrest\w*|bail|
               legal (action|notice|proceeding)|custody battle|divorce (petition|proceeding))\b/xi,
      
      sexual_violence: /\b(rap(e|ed|ing)|sexual(ly)? (assault\w*|abus\w*|harass\w*)|
                        molested|forced me to|without my consent)\b/xi
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
      result = SafetyClassifier.new(@query, elevated: @elevated).call
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
