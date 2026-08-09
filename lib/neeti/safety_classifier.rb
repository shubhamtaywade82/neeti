# lib/neeti/safety_classifier.rb
# LLM-based safety classifier for crisis detection
# Uses RubyLLM with timeout to ensure fail-closed behavior

module Neeti
  class SafetyClassifier
    CATEGORIES = %w[crisis self_harm violence abuse illegal emergency].freeze
    
    attr_reader :query, :timeout_seconds
    
    def initialize(query, timeout_seconds: 1.5)
      @query = query.to_s.strip
      @timeout_seconds = timeout_seconds
    end
    
    def classify
      Timeout.timeout(timeout_seconds) do
        response = RubyLLM.chat(
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: <<~PROMPT.strip
                You are a safety classifier for a Chanakya Niti advice application.
                Classify the user's query into ONE of these categories:
                - crisis: Immediate mental health crisis, suicidal ideation, self-harm
                - self_harm: References to harming oneself
                - violence: References to violence against others
                - abuse: Domestic abuse, child abuse, elder abuse
                - illegal: Requests for illegal activities
                - emergency: Any situation requiring immediate professional intervention
                - safe: Normal queries that can be handled by the advisor
                
                Return ONLY the category name, nothing else.
              PROMPT
            },
            {
              role: "user",
              content: query
            }
          ],
          temperature: 0.0
        )
        
        category = response.content.strip.downcase
        CATEGORIES.include?(category) ? category : "safe"
      end
    rescue Timeout::Error
      Rails.logger.warn(event: "safety_classifier.timeout", query_hash: query_hash)
      "timeout"
    rescue => e
      Rails.logger.error(event: "safety_classifier.error", error: e.class, message: e.message)
      "error"
    end
    
    def is_crisis?
      result = classify
      ["crisis", "self_harm", "violence", "abuse", "illegal", "emergency"].include?(result)
    end
    
    def is_safe?
      classify == "safe"
    end
    
    private
    
    def query_hash
      Digest::SHA256.hexdigest(query)[0..7]
    end
  end
end
