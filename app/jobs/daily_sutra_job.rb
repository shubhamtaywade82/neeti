class DailySutraJob < ApplicationJob
  queue_as :default

  def perform
    User.where('daily_reset_at < ?', Date.today).find_each do |user|
      user.update_columns(daily_query_count: 0, daily_reset_at: Date.today)
    end
    Rails.logger.info("DailySutraJob: reset #{User.count} users for #{Date.today}")
  end
end
