# frozen_string_literal: true

class InsightExtractionJob < ApplicationJob
  queue_as :default

  def perform(user_id, query, response)
    user     = User.find(user_id)
    provider = Neeti::ModelRouter.for(:extract_insights)
    msgs = [
      { role: "system", content: Neeti::Prompts::INSIGHT_SYSTEM },
      { role: "user",   content: "User said: #{query}\nAdvisor replied: #{response}" }
    ]
    raw      = provider.chat(messages: msgs)
    insights = JSON.parse(raw.match(/\[.*\]/m)&.to_s || "[]")
    insights.each do |insight|
      next unless insight["type"].in?(%w[goal challenge preference])
      user.user_insights.create!(insight_type: insight["type"], content: insight["content"].truncate(500))
    end
  rescue => e
    Rails.logger.error("InsightExtractionJob user=#{user_id}: #{e.message}")
  end
end
