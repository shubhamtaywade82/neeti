module Api::V1
  class AdminController < ApplicationController
    include AdminOnly

    # GET /api/v1/admin/stats
    def stats
      render json: {
        users: {
          total:       User.count,
          admins:      User.where(role: 'admin').count,
          by_plan:     User.group(:plan).count,
          new_today:   User.where('created_at >= ?', Date.today).count,
          new_week:    User.where('created_at >= ?', 1.week.ago).count,
        },
        conversations: {
          total:     Conversation.count,
          today:     Conversation.where('created_at >= ?', Date.today).count,
        },
        messages: {
          total:   Message.count,
          today:   Message.where('created_at >= ?', Date.today).count,
        },
        sutras:  { total: Sutra.count },
        themes:  { total: Theme.count },
        insights: { total: UserInsight.count },
      }
    end

    # GET /api/v1/admin/users?page=1&per=20&plan=free&q=email
    def users
      scope = User.order(created_at: :desc)
      scope = scope.where(plan: params[:plan]) if params[:plan].present?
      scope = scope.where('email ILIKE ?', "%#{params[:q]}%") if params[:q].present?

      total = scope.count
      page  = (params[:page] || 1).to_i
      per   = [[(params[:per] || 20).to_i, 100].min, 1].max
      users = scope.offset((page - 1) * per).limit(per)
      counts = Conversation.where(user_id: users.map(&:id)).group(:user_id).count

      render json: {
        total: total,
        page:  page,
        per:   per,
        users: users.map { |u|
          { id: u.id, email: u.email, plan: u.plan, role: u.role,
            daily_query_count: u.daily_query_count,
            created_at: u.created_at, conversations_count: counts[u.id] || 0 }
        }
      }
    end

    # PATCH /api/v1/admin/users/:id  — override plan or role
    def update_user
      target = User.find(params[:id])
      target.update!(admin_user_params)
      render json: { id: target.id, email: target.email, plan: target.plan, role: target.role }
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'User not found' }, status: :not_found
    rescue => e
      Rails.logger.error("Admin update_user error: #{e.class}: #{e.message}")
      render json: { error: 'Update failed.' }, status: :unprocessable_entity
    end

    # DELETE /api/v1/admin/users/:id
    def destroy_user
      target = User.find(params[:id])
      return render json: { error: 'Cannot delete self' }, status: :unprocessable_entity if target.id == current_user.id
      target.destroy
      head :no_content
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'User not found' }, status: :not_found
    end

    # GET /api/v1/admin/sutras?q=text&chapter=1
    def sutras
      scope = Sutra.order(:chapter, :canonical_id)
      scope = scope.where(chapter: params[:chapter]) if params[:chapter].present?
      scope = scope.full_text_search(params[:q])     if params[:q].present?
      total  = scope.count
      page   = (params[:page] || 1).to_i
      per    = (params[:per]  || 20).to_i
      sutras = scope.offset((page - 1) * per).limit(per)
      render json: {
        total: total, page: page, per: per,
        sutras: sutras.map { |s|
          { id: s.id, canonical_id: s.canonical_id, chapter: s.chapter,
            chapter_title: s.chapter_title, translation_en: s.translation_en,
            themes: s.themes }
        }
      }
    end

    private

    def admin_user_params
      params.permit(:plan, :role)
    end
  end
end
