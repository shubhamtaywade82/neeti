class ApplicationController < ActionController::API
  before_action :authenticate!

  private

  def authenticate!
    token   = request.headers['Authorization']&.split(' ')&.last
    payload = JwtService.decode(token)
    @current_user = User.find(payload['user_id'])
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end

  attr_reader :current_user
end
