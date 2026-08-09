# config/initializers/safety_resources.rb
Rails.application.config.to_prepare do
  data = YAML.load_file(Rails.root.join("config/safety_resources.yml"))
  
  stale = data.flat_map { |_, v| v["resources"] }
              .select { |r| Date.parse(r["verified_on"]) < 120.days.ago.to_date }
  
  if stale.any?
    message = "Stale crisis resources (verify + update verified_on): " \
              "#{stale.map { |r| r['name'] }.join(', ')}"
    raise message if Rails.env.production?
    Rails.logger.warn(message)
  end
  
  Rails.application.config.x.safety_resources = data.freeze
end
