class Rack::Attack
  # Throttle login/register attempts by IP
  throttle('auth/ip', limit: 10, period: 60) do |req|
    if req.path == '/api/v1/auth/login' || req.path == '/api/v1/auth/register'
      req.ip
    end
  end

  # Throttle forgot password by IP
  throttle('forgot_password/ip', limit: 3, period: 300) do |req|
    req.path == '/api/v1/auth/forgot_password' ? req.ip : nil
  end

  # Throttle advisor SSE endpoint per user
  throttle('advice/user', limit: 20, period: 60) do |req|
    if req.path == '/api/v1/advice' && req.post?
      token = req.env['HTTP_AUTHORIZATION']&.split(' ')&.last
      token.presence || req.ip
    end
  end
end

Rack::Attack.enabled = ENV.fetch('RACK_ATTACK_ENABLED', 'false') == 'true'
