# app/workers/compliance_worker.rb
class ComplianceWorker
  include Sidekiq::Worker

  def perform(chat_id, message)
    chat = ComplianceAgent.find(chat_id)
    
    # Stream chunks (including thinking traces) to the frontend
    chat.ask(message) do |chunk|
      ActionCable.server.broadcast("chat_#{chat_id}", { 
        thinking: chunk.thinking&.text, # The chain-of-thought reasoning
        content: chunk.content,         # The final answer
        done: chunk.done
      })
    end
  end
end
