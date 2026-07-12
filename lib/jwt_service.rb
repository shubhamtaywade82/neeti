class JwtService
  SECRET_KEY = ENV.fetch('JWT_SECRET_KEY') { Rails.application.secret_key_base }
  EXPIRY     = 2.hours

  def self.encode(expiry: EXPIRY, **payload)
    payload[:exp] = expiry.from_now.to_i
    payload[:iat] = Time.current.to_i
    payload[:jti] = SecureRandom.hex(8)
    JWT.encode(payload, SECRET_KEY, 'HS256')
  end

  def self.decode(token)
    JWT.decode(token, SECRET_KEY, true, algorithm: 'HS256').first
  end
end
