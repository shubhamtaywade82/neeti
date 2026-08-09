# config/initializers/safety_resources.rb
# Boot-time verification of safety resources freshness

Rails.application.config.to_prepare do
  require "yaml"

  resources_file = Rails.root.join("config/safety_resources.yml")

  if File.exist?(resources_file)
    resources = YAML.load_file(resources_file)
    last_verified = Date.parse(resources["last_global_verification"])
    days_since_verification = (Date.today - last_verified).to_i

    if days_since_verification > 120
      error_msg = <<~ERROR.strip
        SAFETY RESOURCES STALE: Crisis helplines have not been verified in #{days_since_verification} days.
        Last verification: #{last_verified}
        Maximum allowed: 120 days

        Please verify all crisis resources against official sources and update#{' '}
        config/safety_resources.yml before deploying.

        This is a hard fail to prevent launching with outdated emergency contacts.
      ERROR

      if Rails.env.production?
        raise error_msg
      else
        Rails.logger.warn("[SAFETY] #{error_msg}")
      end
    end
  else
    warning = "Safety resources file not found at config/safety_resources.yml"
    if Rails.env.production?
      raise warning
    else
      Rails.logger.warn("[SAFETY] #{warning}")
    end
  end
end
