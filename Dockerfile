ARG RUBY_VERSION=3.3.4
FROM ruby:${RUBY_VERSION}-slim AS base

WORKDIR /rails

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential curl git libpq-dev nodejs npm postgresql-client && \
    npm install -g yarn && \
    rm -rf /var/lib/apt/lists/*

COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test && \
    bundle exec bootsnap precompile --gemfile

COPY . .
RUN bundle exec bootsnap precompile app/ lib/

RUN cd frontend && npm ci && npm run build && cd .. && \
    mkdir -p public && cp -r frontend/dist/. public/

RUN chmod +x bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/rails/bin/docker-entrypoint.sh"]
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
