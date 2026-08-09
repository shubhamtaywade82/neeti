Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Auth
      post "/auth/register",         to: "auth#register"
      post "/auth/login",            to: "auth#login"
      get  "/auth/me",               to: "auth#me"
      post "/auth/forgot_password",  to: "auth#forgot_password"
      post "/auth/reset_password",   to: "auth#reset_password"

      # Advisor (SSE streaming) — implemented in Task 7
      post "/advice", to: "advisor#create"

      # Conversations
      resources :conversations, only: [ :index, :show, :destroy ] do
        resources :messages, only: [ :index ]
      end

      # Daily Sutra
      get "/daily_sutra", to: "daily_sutra#show"

      # Packs management
      get  "/packs",            to: "packs#index"
      post "/packs/install",    to: "packs#install"
      post "/packs/uninstall",  to: "packs#uninstall"

      # Sutras explorer
      get "/sutras", to: "sutras#index"

      # Graph explorer
      get "/graph", to: "graph#index"

      # Memory Insights
      resources :insights, only: [ :index, :destroy ]

      # Users / account management
      get    "/users/me",    to: "users#show"
      patch  "/users/me",    to: "users#update"
      delete "/users/me",    to: "users#destroy"
      get    "/users/usage", to: "users#usage"

      # Admin
      namespace :admin do
        get    "stats",        to: "/api/v1/admin#stats"
        get    "users",        to: "/api/v1/admin#users"
        patch  "users/:id",    to: "/api/v1/admin#update_user"
        delete "users/:id",    to: "/api/v1/admin#destroy_user"
        get    "sutras",       to: "/api/v1/admin#sutras"
      end

      # Collections
      resources :collections, only: [ :index, :show, :create, :update, :destroy ]

      # Documents
      resources :documents, only: [ :index, :show, :create, :update, :destroy ]

      # AI Chats (Compliance Agent)
      resources :chats, only: [ :create, :show ]

      # Subscriptions — implemented in Task 8
      get    "/subscriptions/plans",   to: "subscriptions#plans"
      post   "/subscriptions",         to: "subscriptions#create"
      delete "/subscriptions",         to: "subscriptions#cancel"
      post   "/subscriptions/webhook", to: "subscriptions#webhook"
    end
  end

  get "/up", to: proc { [ 200, {}, [ "OK" ] ] }
end
