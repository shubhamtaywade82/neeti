Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins = if Rails.env.production?
                ENV.fetch("CORS_ORIGINS").split(",")
    else
                ENV.fetch("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(",")
    end
    origins origins
    resource "*", headers: :any, methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
  end
end
