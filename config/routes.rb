Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Auth
      post '/auth/register', to: 'auth#register'
      post '/auth/login',    to: 'auth#login'
      get  '/auth/me',       to: 'auth#me'

      # Advisor (SSE streaming) — implemented in Task 7
      post '/advice', to: 'advisor#create'

      # Conversations
      resources :conversations, only: [:index, :show, :destroy] do
        resources :messages, only: [:index]
      end

      # Subscriptions — implemented in Task 8
      get    '/subscriptions/plans',   to: 'subscriptions#plans'
      post   '/subscriptions',         to: 'subscriptions#create'
      delete '/subscriptions',         to: 'subscriptions#cancel'
      post   '/subscriptions/webhook', to: 'subscriptions#webhook'
    end
  end

  get '/up', to: proc { [200, {}, ['OK']] }
end
