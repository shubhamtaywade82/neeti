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

      # Daily Sutra
      get '/daily_sutra', to: 'daily_sutra#show'

      # Users / account management
      get    '/users/me',    to: 'users#show'
      patch  '/users/me',    to: 'users#update'
      delete '/users/me',    to: 'users#destroy'
      get    '/users/usage', to: 'users#usage'

      # Admin
      namespace :admin do
        get    'stats',        to: '/api/v1/admin#stats'
        get    'users',        to: '/api/v1/admin#users'
        patch  'users/:id',    to: '/api/v1/admin#update_user'
        delete 'users/:id',    to: '/api/v1/admin#destroy_user'
        get    'sutras',       to: '/api/v1/admin#sutras'
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
