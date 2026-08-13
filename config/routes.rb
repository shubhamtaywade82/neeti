Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Auth
      post '/auth/register',         to: 'auth#register'
      post '/auth/login',            to: 'auth#login'
      get  '/auth/me',               to: 'auth#me'
      post '/auth/forgot_password',  to: 'auth#forgot_password'
      post '/auth/reset_password',   to: 'auth#reset_password'

      # Advisor (SSE streaming) — implemented in Task 7
      post '/advice', to: 'advisor#create'

      # Conversations
      resources :conversations, only: [:index, :show, :destroy] do
        resources :messages, only: [:index]
      end

      # Consultations (new state machine-based consultations replacing chat)
      resources :consultations, only: [:index, :show] do
        member do
          post 'reaction', to: 'consultations#reaction'
        end
      end

      # Daily Sutra
      get '/daily_sutra', to: 'daily_sutra#show'

      # Packs management
      get  '/packs',            to: 'packs#index'
      post '/packs/install',    to: 'packs#install'
      post '/packs/uninstall',  to: 'packs#uninstall'

      # Sutras explorer (public library for SEO)
      get '/sutras', to: 'sutras#index'
      get '/sutras/public', to: 'sutras#public_index'
      get '/sutras/:id', to: 'sutras#show'

      # Graph explorer
      get '/graph', to: 'graph#index'

      # Memory Insights
      resources :insights, only: [:index, :destroy]

      # Users / account management
      get    '/users/me',    to: 'users#show'
      patch  '/users/me',    to: 'users#update'
      delete '/users/me',    to: 'users#destroy'
      get    '/users/usage', to: 'users#usage'
      
      # Credit ledger & purchases
      get    '/credits',     to: 'credits#index'
      post   '/credits/purchase', to: 'credits#purchase'
      post   '/credits/webhook', to: 'credits#webhook'

      # Admin
      namespace :admin do
        get    'stats',        to: '/api/v1/admin#stats'
        get    'users',        to: '/api/v1/admin#users'
        patch  'users/:id',    to: '/api/v1/admin#update_user'
        delete 'users/:id',    to: '/api/v1/admin#destroy_user'
        get    'sutras',       to: '/api/v1/admin#sutras'
        get    'curation_queue', to: '/api/v1/admin#curation_queue'
        patch  'sutras/:id',   to: '/api/v1/admin#update_sutra'
      end

      # Collections
      resources :collections, only: [:index, :show, :create, :update, :destroy]

      # Documents
      resources :documents, only: [:index, :show, :create, :update, :destroy]

      # AI Chats (Compliance Agent)
      resources :chats, only: [:create, :show]

      # Subscriptions — implemented in Task 8
      get    '/subscriptions/plans',   to: 'subscriptions#plans'
      post   '/subscriptions',         to: 'subscriptions#create'
      delete '/subscriptions',         to: 'subscriptions#cancel'
      post   '/subscriptions/webhook', to: 'subscriptions#webhook'
    end
  end

  # Public pages for SEO
  get '/library', to: redirect('/#/library')
  get '/methodology', to: redirect('/#/methodology')
  
  get '/up', to: proc { [200, {}, ['OK']] }
end
