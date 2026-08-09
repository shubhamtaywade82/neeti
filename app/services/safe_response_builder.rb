# Builds the routed (crisis) response shown to a user instead of corpus
# advice. Resources come only from config/safety_resources.yml — verified,
# India-first contacts — never hardcoded in a controller. See PRD §7.3.
class SafeResponseBuilder
  RESOURCE_GROUP_BY_CATEGORY = {
    self_harm: "helplines",
    sexual_violence: "helplines",
    medical: "helplines",
    legal: "helplines",
    abuse: "domestic_violence",
    minors: "child_protection"
  }.freeze

  MESSAGE = "It sounds like you're going through something difficult. " \
            "This is outside what a strategy text can help with — please reach out " \
            "to one of the resources below.".freeze

  def initialize(categories)
    @categories = Array(categories)
  end

  def call
    { message: MESSAGE, resources: resources }
  end

  private

  def resources
    groups = @categories.map { |c| RESOURCE_GROUP_BY_CATEGORY[c.to_sym] }.compact.uniq
    groups = [ "helplines" ] if groups.empty?

    groups.flat_map { |group| data.dig(group, "india") || [] }
          .uniq { |r| r["name"] }
          .map { |r| { name: r["name"], contact: r["phone"], hours: r["hours"], website: r["website"] } }
  end

  def data
    @data ||= YAML.load_file(Rails.root.join("config/safety_resources.yml"))
  end
end
