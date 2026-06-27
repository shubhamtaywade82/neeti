# Neeti — Feature Catalog

> Source of truth for features mentioned in `docs/PRD.md`.
> grouped by capability area and release stage where the PRD defines one.

---

## 1. Core Platform / Backend

### 1.1 Retrieval Engine
- Structured Retrieval (PostgreSQL-native, no vector DB)
- PostgreSQL full-text search (`tsvector` + `pg_search`)
- Exact metadata match across sutra taxonomy
- LLM-as-Classifier for theme routing
- Knowledge-graph expansion via recursive CTEs
- Cache-Augmented Generation (CAG) mode for full-corpus reasoning
- Hybrid retrieval fallback chain:
  - metadata match → FTS → LLM classifier → graph expansion → optional embeddings

### 1.2 Knowledge Model
- Sutra as first-class structured entity (not a vector chunk)
- Normalized taxonomy:
  - themes
  - virtues
  - vices
  - situations
  - emotions
- Chapter + canonical ID indexing
- Sanskrit + transliteration + English + Hindi storage
- Theme graph relationships stored in PostgreSQL

### 1.3 Agent Runtime
- ReAct + Reflection loop
- Plan → Act → Observe → Reflect → Refine
- Confidence-gated reflection (cheap when retrieval is strong)
- Tool calling support:
  - retrieve_sutras
  - query_graph
  - reflect
  - search_memory
- Persona enforcement (Chanakya voice / strategic advisor behavior)

### 1.4 LLM Infrastructure
- Multi-provider router
- Local LLM via Ollama
- Cloud fallback routing to OpenAI / Anthropic
- OpenAI-compatible production facade
- Temperature / streaming / tool-call normalization across providers
- Stable provider interface:
  - chat
  - generate
  - embed
  - structured output
  - tool call

---

## 2. Memory

- Conversation history
- Short-term session memory
- Long-term user insights / profile memory
- Async insight extraction job
- Structured user insight records (category, theme, content, confidence)
- Episodic memory support
- Cross-session personalization

---

## 3. Frontend / UX

### 3.1 Chat Experience
- Streaming advisor responses (SSE / EventSource)
- Conversation flow with message history
- CAG / retrieval mode toggle
- Cited sutras shown with every completion event
- Reflection score exposure
- Prefill query support
- Toggle between Chat / CAG mode

### 3.2 UI Components
- Conversation sidebar
- Daily Sutra widget
- Subscription modal
- Auth screens:
  - login
  - register
- Profile / account screens
- Upgrade flow for free-tier users

### 3.3 Frontend Architecture
- React + TypeScript + Vite
- Tailwind styling
- Zustand state management
- PWA-ready
- Offline caching for sutras

---

## 4. Authentication & Accounts

- JWT + Bcrypt authentication
- Register endpoint
- Login endpoint
- Current user profile endpoint
- Role-based access control (user / admin)
- Password hashing via `has_secure_password`

---

## 5. Subscription & Billing

- Freemium subscription model
- Razorpay integration
- Razorpay webhook handling
- Plan creation / cancellation endpoints
- Plan listing endpoint
- Daily usage quota enforcement by plan tier
- Subscription gated by plan limits
- Upgrade flow surfaced in UI

---

## 6. Admin Features

- Admin statistics
- User management
- Sutras management
- Role-based admin access

---

## 7. Evaluation & Measurement

- Benchmark query dataset
- Automated nightly evaluation runs
- Retrieval quality metrics:
  - Recall@5
  - Recall@10
  - Theme Precision
  - Answer Quality
- Golden dataset / regression checks
- Evaluation query + expected output schema

---

## 8. Retention & Growth Features

- Daily Sutra system
- Morning relevant sutra delivery
- Context-aware daily sutra selection
- Feedback system
- Thumbs up / thumbs down
- Bug report feedback
- Analytics collection

---

## 9. Future / Roadmap Features

### 9.1 Advisor Modules
- Career Advisor
- Leadership Advisor
- Relationship Advisor
- Learning Advisor
- Founder Advisor
- Bhagavad Gita Advisor
- Arthashastra Advisor
- Stoicism Advisor
- Sun Tzu Advisor
- Atomic Habits Advisor
- Modern Psychology Advisor

### 9.2 Experience Extensions
- Weekly Review
- Decision Journal
- Progress Dashboard
- Push Notifications (Telegram / Email)
- Voice responses / audio summaries
- Image support
- Export conversations / insights
- Theme browsing
- Search history

### 9.3 Platform Features
- Developer API
- Enterprise team coaching
- Enterprise knowledge base
- Marketplace
- Community features
- Expert network / coaching marketplace
- Courses
- Multi-advisor platform support

---

## 10. Strategic / Operational Features

- Explainable retrieval (transparent source citations)
- AI transparency disclosure
- No-medical-claims guardrail
- DPDP-compliant data handling guidance
- Structured Chanakya response format:
  - Diagnosis
  - Relevant sutras
  - Interpretation
  - Action plan
  - Reflection question

---

## 11. Non-Goals (Explicitly Excluded)

- Human coaching (delayed)
- Neo4j / separate graph database
- Qdrant / external vector database
- Multi-agent systems
- Complex workflows
- Audio (delayed)
- WhatsApp integration (delayed)
- Mobile-only native app
- Enterprise-first launch

---

## 12. Feature Priority by Release

| Release | Focus |
|---|---|
| R0 | Retrieval accuracy benchmark |
| R1 | Core answer quality + feedback |
| R2 | Day-7 retention (auth + history) |
| R3 | Paid conversion (memory + daily sutra + payments) |
| R4 | Monthly retention + vertical advisor modules |
| R5 | Monthly Recurring Revenue (platform expansion) |
