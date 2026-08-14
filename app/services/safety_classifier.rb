# app/services/safety_classifier.rb
class SafetyClassifier
  MODEL = ENV.fetch("NEETI_SAFETY_MODEL", "claude-haiku-4-5-20251001")
  TIMEOUT = Float(ENV.fetch("NEETI_SAFETY_TIMEOUT", 1.5))

  Result = Struct.new(:categories, :confidence, keyword_init: true)

  SYSTEM = <<~PROMPT
    Classify whether a message describes a situation needing professional or
    crisis support rather than general strategic advice.

    Categories: self_harm, abuse, minors, medical, legal, sexual_violence

    Return ONLY raw JSON: {"categories": [...], "confidence": 0.0-1.0}
    Empty array if none apply.

    Err toward flagging. A wrongly flagged career question is a minor
    inconvenience; a missed crisis is not.
  PROMPT

  def initialize(query, elevated: false)
    @query = query
    @elevated = elevated
  end

  def call
    raw = Timeout.timeout(TIMEOUT) do
      chat = RubyLLM.chat(model: MODEL)
      chat.with_instructions(SYSTEM)
      chat.ask(user_prompt).content
    end

    parsed = JSON.parse(raw.to_s.gsub(/\A```(?:json)?|```\z/m, "").strip)
    categories = Array(parsed["categories"]).map(&:to_sym) & IntentRouter::CATEGORIES

    Result.new(categories: categories, confidence: parsed["confidence"].to_f)
  rescue Timeout::Error, JSON::ParserError => e
    raise  # IntentRouter fails closed on this
  end

  private

  def user_prompt
    prefix = @elevated ? "[This user was routed earlier in this session — apply heightened sensitivity.]\n\n" : ""
    "#{prefix}MESSAGE:\n#{@query}"
  end
end
