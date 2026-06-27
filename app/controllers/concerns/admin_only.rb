module AdminOnly
  extend ActiveSupport::Concern
  included do
    before_action :require_admin!
  end
  private
  def require_admin!
    render json: { error: 'Forbidden' }, status: :forbidden unless current_user&.admin?
  end
end
