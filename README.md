# Neeti — Chanakya Personal Advisor

Chanakya Niti–based personal advisor AI. Ask strategic questions; receive grounded advice cited from 455 sutras.

**Stack:** Rails 8.1.3 API · React 18 + Vite · PostgreSQL 16 · Ollama (local) / Anthropic (production) · Razorpay · Kamal 2

---

## Architecture

- **Structured RAG on PostgreSQL** — no vector DB. 455 sutras with GIN-indexed metadata arrays + tsvector FTS + recursive CTE graph expansion. Sub-15ms retrieval, 100% explainable citations.
- **4-layer retrieval:** metadata keyword match → full-text search → LLM theme classifier → graph expansion
- **ReAct + Reflection agent** — scores its own draft; refines if score < 6 to prevent hallucinated sutras
- **SSE streaming** via `ActionController::Live`
- **Solid Queue** for async insight extraction (no Redis)

---

## Requirements

- Ruby 3.3.4
- PostgreSQL 16
- Node.js 20+
- Ollama (for local LLM)

---

## Local Setup

```bash
# 1. Install dependencies
bundle install
cd frontend && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# edit .env — set JWT_SECRET_KEY at minimum

# 3. Database
bundle exec rails db:create db:migrate db:seed

# 4. Start Ollama and pull model
ollama serve &
ollama pull llama3.1:8b
```

**Run (3 terminals):**

```bash
# Terminal 1 — Rails API
bundle exec rails server
# → http://localhost:3000

# Terminal 2 — Ollama
ollama serve

# Terminal 3 — Frontend
cd frontend && npm run dev
# → http://localhost:5173
```

Open `http://localhost:5173`, register, start chatting.

---

## Docker Compose

```bash
cp .env.example .env          # set JWT_SECRET_KEY
docker compose up --build

# Pull Ollama model (first run only)
docker compose exec ollama ollama pull llama3.1:8b

# Seed sutras and themes
docker compose exec app bundle exec rails db:seed
```

Services:
| Service | Port | Description |
|---------|------|-------------|
| app | 3000 | Rails API |
| frontend | 5173 | Vite dev server |
| db | 5432 | PostgreSQL 16 |
| ollama | 11434 | Local LLM |
| worker | — | Solid Queue jobs |

---

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET_KEY` | yes | HS256 signing key (min 64 chars) |
| `OLLAMA_URL` | dev | Default: `http://localhost:11434` |
| `ANTHROPIC_API_KEY` | prod | Enables Anthropic in production |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | payments | Razorpay credentials |
| `RAZORPAY_WEBHOOK_SECRET` | payments | Webhook signature verification |

---

## API

All endpoints under `/api/v1`. Auth via `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account, returns JWT |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Current user |
| POST | `/advice` | SSE streaming advice (text/event-stream) |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id` | Show conversation |
| GET | `/subscriptions/plans` | Plan pricing |
| POST | `/subscriptions` | Create Razorpay subscription |
| DELETE | `/subscriptions` | Cancel subscription |
| POST | `/subscriptions/webhook` | Razorpay webhook |

### SSE Advice Stream

```bash
curl -X POST http://localhost:3000/api/v1/advice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"query": "How do I handle betrayal by a trusted colleague?"}'
```

Events:
- `data: {"type":"token","content":"..."}` — streamed text
- `data: {"type":"complete","conversation_id":1,"cited_sutras":[...],"reflection_score":8}` — done
- `data: {"type":"error","message":"..."}` — error

---

## Plans

| Plan | Price | Queries/day |
|------|-------|-------------|
| Free | ₹0 | 3 |
| Seeker | ₹199/mo | Unlimited |
| Strategist | ₹499/mo | Unlimited + memory |
| Raja | ₹1,999/mo | Unlimited + expert review |

---

## Tests

```bash
bundle exec rspec                    # all specs (60 examples)
bundle exec rspec spec/models/       # model specs
bundle exec rspec spec/requests/     # API request specs
cd frontend && npm run test          # component tests (vitest)
```

---

## Production Deploy (Kamal 2)

```bash
# First deploy
kamal setup

# Subsequent deploys
kamal deploy

# Post-deploy seed (first time only)
kamal app exec --reuse "bundle exec rails db:seed"

# Pull production LLM model on server
kamal accessory exec ollama "ollama pull llama3.3:70b"
```

Edit `config/deploy.yml` — replace `YOUR_SERVER_IP` and `YOUR_DOCKERHUB_USERNAME` before deploying.
