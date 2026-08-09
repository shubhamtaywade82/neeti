# lib/neeti/intent_router.rb
module Neeti
  class IntentRouter
    # Crisis keywords that should bypass retrieval and trigger safety response
    CRISIS_KEYWORDS = %w[
      suicide suicidal kill myself death die depressed depression
      hurt harm self-harm self-harming overdose
      emergency crisis help immediately urgent
      murder homicide violence attack threaten threatened
    ].freeze
    
    # Greeting/small talk patterns that need minimal retrieval
    GREETING_PATTERNS = [
      /\b(hi|hello|hey|greetings|namaste)\b/i,
      /\b(how are you|how's it going|what's up)\b/i,
      /\b(good morning|good afternoon|good evening)\b/i,
      /\b(thank(s| you)|thanks a lot|appreciate)\b/i,
      /\b(yes|no|okay|ok|sure|maybe)\b$/i,
    ].freeze
    
    # Simple factual questions that can use reduced retrieval
    FACTUAL_PATTERNS = [
      /^what is /i,
      /^who is /i,
      /^when did /i,
      /^where is /i,
      /^how many /i,
      /^define /i,
      /^explain /i,
    ].freeze
    
    def initialize(llm_classifier: nil)
      @llm = llm_classifier
    end
    
    # Route a query to determine handling strategy
    # Returns { route: symbol, confidence: float, reason: string }
    def route(query)
      return crisis_route(query) if crisis?(query)
      return greeting_route(query) if greeting?(query)
      return factual_route(query) if factual?(query)
      
      # Default: full retrieval pipeline
      default_route(query)
    end
    
    # Check if query indicates crisis/emergency requiring immediate safety response
    def crisis?(query)
      normalized = query.downcase.strip
      
      # Keyword match
      return true if CRISIS_KEYWORDS.any? { |kw| normalized.include?(kw) }
      
      # Pattern match for self-harm ideation
      return true if normalized =~ /(want|need|think about|planning) to (hurt|kill|end) myself/i
      return true if normalized =~ /(life is|feels) (pointless|hopeless|worthless)/i
      
      false
    end
    
    # Check if query is simple greeting/small talk
    def greeting?(query)
      GREETING_PATTERNS.any? { |pattern| query.match?(pattern) }
    end
    
    # Check if query is simple factual question
    def factual?(query)
      FACTUAL_PATTERNS.any? { |pattern| query.match?(pattern) } && query.split.size < 10
    end
    
    private
    
    def crisis_route(query)
      {
        route: :crisis,
        confidence: 1.0,
        reason: 'Crisis/emergency detected - bypass retrieval, show safety resources',
        action: :show_safety_resources
      }
    end
    
    def greeting_route(query)
      {
        route: :greeting,
        confidence: 0.9,
        reason: 'Greeting/small talk - minimal retrieval needed',
        action: :minimal_retrieval
      }
    end
    
    def factual_route(query)
      {
        route: :factual,
        confidence: 0.7,
        reason: 'Factual question - use focused retrieval',
        action: :focused_retrieval
      }
    end
    
    def default_route(query)
      # Use LLM classifier for ambiguous cases if available
      if @llm && ambiguous?(query)
        classification = @llm.classify_intent(query)
        return classification if classification[:confidence] > 0.6
      end
      
      {
        route: :full_retrieval,
        confidence: 0.5,
        reason: 'Standard query - use full retrieval pipeline',
        action: :full_retrieval
      }
    end
    
    def ambiguous?(query)
      # Query is ambiguous if it's neither clearly factual nor clearly advice-seeking
      words = query.downcase.split
      words.size.between?(5, 20) && 
        !GREETING_PATTERNS.any? { |p| query.match?(p) } &&
        !FACTUAL_PATTERNS.any? { |p| query.match?(p) }
    end
  end
end
