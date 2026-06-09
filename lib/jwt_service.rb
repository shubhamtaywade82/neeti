class JwtService
  SECRET_KEY = ENV.fetch('JWT_SECRET_KEY') { Rails.application.secret_key_base }
  EXPIRY     = 30.days

  def self.encode(expiry: EXPIRY, **payload)
    payload[:exp] = expiry.from_now.to_i
    JWT.encode(payload, SECRET_KEY, 'HS256')
  end

  def self.decode(token)
    JWT.decode(token, SECRET_KEY, true, algorithm: 'HS256').first
  end
end
