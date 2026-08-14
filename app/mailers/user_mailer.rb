class UserMailer < ApplicationMailer
  def reset_password(user)
    @user = user
    @reset_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5185')}/reset-password?token=#{user.reset_token}"
    mail to: user.email, subject: 'Reset your KOS password'
  end
end
