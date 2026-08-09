class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAILER_FROM", "KOS <noreply@kos.app>")
  layout "mailer"
end
