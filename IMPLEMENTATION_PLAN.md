# Neeti Implementation Plan

## Vision
**Neeti** — Knowledge Operating System
- Platform that converts trusted knowledge sources into interactive, cited, explainable AI advisors
- First Knowledge Pack: Chanakya Neeti (455 sutras, 17 chapters)
- Extensible to: Bhagavad Gita, Dr. Ambedkar, Stoicism, Engineering docs, Trading playbooks, Company knowledge, Personal notes

## Stack (Locked In)

| Layer | Technology |
|-------|------------|
| **Backend** | Rails 8 API + Solid Queue/Cache/Cable |
| **Frontend** | React/Typescript/Vite + Tailwind + shadcn/ui |
| **Database** | PostgreSQL 16 (tsvector, recursive CTEs, pgvector optional) |
| **Local LLM** | Ollama (qwen3:8b primary, qwen3:30b-a3b upgrade, llama3.3:70b fallback) |
| **Cloud LLM** | OpenAI GPT-4o-mini → Anthropic Claude 3.5 |
| **Auth** | JWT + Bcrypt (stateless) |
| **Payments** | Razorpay (India-native subscriptions) |
| **Deploy** | Kamal 2 (Rails 8 native, Docker-based) |
| **Retrieval** | Structured RAG: Metadata → FTS → Graph → Optional Embeddings |
| **Memory** | PostgreSQL (durable) + Redis/Solid Cache (session) |
| **Agent** | Custom Ruby ReAct + Reflection (no LangGraph) |

## Architecture Principles

1. **No vector DB in v1** — Structured RAG first; embeddings only if benchmark proves necessity
2. **No unstructured storage** — Every passage has canonical_id, concepts, citations
3. **No answer without citations** — Every response traces to source passages
4. **No billing before retention proof** — R3 gate: >30% Day-7 retention in R2
5. **No memory without privacy controls** — Opt-in, classified, user-controllable
6. **No production release without benchmark pass** — CI gate on evaluation metrics
7. **Knowledge Pack isolation** — Chanakya Neeti is one pack; architecture supports N packs

## Release Strategy

| Release | Timeline | Users | Core Features | Success Metric |
|---------|----------|-------|---------------|----------------|
| **R0 — Internal** | Weeks 1-3 | You only | Knowledge base, retrieval, agent, evaluation | >95% retrieval accuracy on 100 benchmarks |
| **R1 — Closed Alpha** | Weeks 4-5 | 20-50 | Chat, citations, reflection, streaming | >80% positive feedback; return rate |
| **R2 — Public Beta** | Weeks 6-8 | 100-500 | Auth, history, feedback, analytics, session memory | >30% Day-7 retention |
| **R3 — MVP Launch** | Weeks 9-11 | 1000+ | Subscriptions (Free/Plus), daily sutra, long-term memory, insights | 5-10% paid conversion |
| **R4 — Growth** | Months 4-6 | 5000+ | Vertical advisors, weekly review, decision journal, notifications | >50% monthly retention |
| **R5 — Platform** | Months 6-12 | 10000+ | Multi-advisor, API, marketplace, enterprise | Product-market fit driven MRR |

## Sprint Plan (2-week sprints)

### Sprint 0 (Week 1): Foundation
- [ ] Rails 8 API + React/TypeScript/Vite monorepo
- [ ] Docker Compose: `app`, `db`, `ollama`, `redis`, `frontend`
- [ ] CI/CD, linting, health checks, Kamal 2 config stub
- [ ] Shared root package.json with workspace config

### Sprint 1 (Week 2): Generic Knowledge Schema + Chanakya Import
- [ ] Schema: `knowledge_packs`, `documents`, `sections`, `passages`, `concepts`, `concept_relationships`, `conversations`, `messages`, `user_insights`, `user_vaults`
- [ ] Chanakya Pack: Import 455 sutras with canonical IDs, Sanskrit + EN/HI translations, chapter structure
- [ ] Ontology: Seed ~150 concepts (virtues, vices, situations, emotions, roles, actions, outcomes)
- [ ] Relationships: `opposes`, `causes`, `supports`, `prevents`, `related_to` — recursive CTE ready

### Sprint 2 (Week 3): Tagging & Retrieval Core
- [ ] Rule-based + LLM-assisted concept tagging for all passages
- [ ] `MetadataRetriever` (concept exact match), `FTSRetriever` (tsvector + GIN)
- [ ] `GraphExpander` (recursive CTE, 2-hop expansion)
- [ ] `HybridRetriever` with scoring + explainability trail

### Sprint 3 (Week 4): Agent Runtime
- [ ] `LLMRouter`: Ollama (qwen3:8b) → OpenAI → Anthropic; unified `chat`/`generate`/`embed`/`tool_call`
- [ ] `AdvisorAgent` ReAct loop: Analyze → Retrieve → Expand → Synthesize → Validate → Store Memory
- [ ] Tool calling: `retrieve_passages`, `expand_concepts`, `search_memory`, `generate_reflection`
- [ ] Chanakya persona prompt + response schema (Diagnosis → Sutras → Interpretation → Action Plan → Reflection)
- [ ] Confidence-gated reflection (only if retrieval confidence < 0.7)

### Sprint 4 (Week 5): Memory & Personalization
- [ ] `conversations` + `messages` in PG; Redis cache for active session
- [ ] `InsightExtractionJob` (Solid Queue): nightly, uses small LLM to extract structured insights
- [ ] Vault isolation: `personal`, `health`, `finance`, `work`, `learning`, `journal`
- [ ] Privacy: opt-in, classification (PUBLIC/PRIVATE/SECRET/LOCAL_ONLY), user dashboard

### Sprint 5 (Week 6): Evaluation + Streaming UI
- [ ] **Evaluation**: 100 benchmark cases; metrics (Precision@5, Recall@10, Faithfulness, Style); CI gate
- [ ] **Frontend**: SSE streaming chat, sutra citation cards, conversation history sidebar, mobile-first PWA
- [ ] Daily Sutra widget (context-aware from memory vaults)

### Sprint 6 (Week 7): Auth, Billing, Quotas
- [ ] JWT + Bcrypt; register/login/password reset; roles
- [ ] Razorpay: Free (20/day), Plus (₹149/mo unlimited + memory + daily sutra), Strategist (₹499/mo + goals + deep dives)
- [ ] Quota middleware + usage counters in Redis
- [ ] Admin dashboard: users, plans, content management

### Sprint 7 (Week 8): Production Hardening
- [ ] Observability: structured logs, Sentry, custom metrics (retrieval latency, token cost, error rates)
- [ ] Reliability: circuit breakers, rate limiting, Solid Queue retry/DLQ, health endpoints
- [ ] Security: secrets (Doppler), CSP, dependency scanning, backup/restore tested
- [ ] Kamal 2 deploy config; zero-downtime + rollback verified
- [ ] DPDP compliance audit

### Sprint 8 (Week 9): Beta Launch & Retention
- [ ] Waitlist → invite flow; onboarding tour; feedback widget
- [ ] Daily Sutra scheduler (7 AM user TZ); email/Telegram/push delivery
- [ ] Analytics: Amplitude/PostHog events; cohort retention dashboards
- [ ] Feature flags (Flipper); weekly review; re-engagement loops

## Database Schema (Generic Knowledge Pack)

```ruby
# Core Knowledge Pack Tables
knowledge_packs          # id, name, slug, version, description, persona, retriever_config, license, enabled
documents                # id, knowledge_pack_id, title, source_type, source_url, language, metadata
sections                 # id, document_id, title, position, metadata
passages                 # id, section_id, canonical_id, passage_type, content, translations (jsonb), search_vector (tsvector), metadata

# Concept/Ontology Tables
concepts                 # id, name, concept_type (virtue/vice/situation/emotion/role/action/outcome/principle), description, metadata
concept_relationships    # id, source_concept_id, target_concept_id, relationship_type (opposes/causes/supports/prevents/related_to/depends_on/contradicts), weight
passage_concepts         # id, passage_id, concept_id, relevance_weight

# User & Memory Tables
users                    # id, email, password_digest, role, plan, vault_encryption_keys (jsonb), settings (jsonb)
conversations            # id, user_id, knowledge_pack_ids (array), title, vault_id, metadata
messages                 # id, conversation_id, role (user/assistant/system/tool), content, metadata (jsonb), token_count
user_insights            # id, user_id, vault_id, category, concept_id, content, confidence, source_message_ids (array)
user_vaults              # id, user_id, name (personal/health/finance/work/learning/journal), encryption_key, access_level

# Billing & Auth
subscriptions            # id, user_id, plan_id, status, razorpay_subscription_id, current_period_end, metadata
usage_counters           # id, user_id, period_start, period_end, queries_count, tokens_used
```

## Key Services Structure

```
app/
├── agents/
│   ├── advisor_agent.rb          # Main ReAct loop
│   ├── planner.rb                # Query analysis & planning
│   └── reflector.rb              # Self-critique & refinement
├── services/
│   ├── llm_router.rb             # Multi-provider LLM abstraction
│   ├── retrieval/
│   │   ├── metadata_retriever.rb
│   │   ├── fts_retriever.rb
│   │   ├── graph_expander.rb
│   │   └── hybrid_retriever.rb
│   ├── memory/
│   │   ├── conversation_store.rb
│   │   ├── insight_extractor.rb
│   │   └── memory_retriever.rb
│   └── knowledge/
│       ├── knowledge_pack_importer.rb
│       ├── concept_tagger.rb
│       └── ontology_manager.rb
├── jobs/
│   ├── insight_extraction_job.rb
│   └── evaluation_job.rb
├── models/
│   ├── knowledge_pack.rb
│   ├── document.rb
│   ├── section.rb
│   ├── passage.rb
│   ├── concept.rb
│   ├── concept_relationship.rb
│   ├── conversation.rb
│   ├── message.rb
│   ├── user_insight.rb
│   └── user_vault.rb
└── controllers/
    └── api/v1/
        ├── chat_controller.rb
        ├── conversations_controller.rb
        ├── insights_controller.rb
        └── knowledge_packs_controller.rb
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── StreamingMessage.tsx
│   │   │   └── CitationCard.tsx
│   │   ├── sidebar/
│   │   │   ├── ConversationHistory.tsx
│   │   │   └── DailySutra.tsx
│   │   └── ui/ (shadcn components)
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useSSE.ts
│   │   └── useConversations.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── sse.ts
│   ├── stores/
│   │   ├── chatStore.ts
│   │   └── authStore.ts
│   ├── types/
│   │   └── api.ts
│   └── App.tsx
```

## Evaluation Benchmark (100 Cases)

Categories:
- Career & Leadership (25)
- Self-discipline & Habits (20)
- Relationships & Trust (20)
- Decision Making (15)
- Finance & Wealth (non-investment) (10)
- Learning & Growth (10)

Each case:
```json
{
  "query": "I procrastinate constantly on important tasks",
  "expected_concepts": ["laziness", "discipline", "self_effort"],
  "expected_passages": ["CN_3_14", "CN_5_2"],
  "expected_response_structure": ["diagnosis", "citations", "interpretation", "action_plan", "reflection_question"]
}
```

## Monorepo Structure

```
neeti/
├── backend/                 # Rails 8 API
├── frontend/                # React + TypeScript + Vite
├── docker-compose.yml
├── docker-compose.override.yml.example
├── .github/workflows/ci.yml
├── config/deploy.yml        # Kamal 2
├── package.json             # Root workspace config
└── README.md
```

## Decisions Made

| Decision | Choice |
|----------|--------|
| Knowledge Pack Architecture | Generic Platform from Day 1 |
| Local LLM | qwen3:8b (primary), qwen3:30b-a3b (upgrade), llama3.3:70b (fallback) |
| Memory Storage | Hybrid Redis (session) + PostgreSQL (durable) |
| Evaluation Timing | Build benchmark Sprint 2-3; Runner + CI Sprint 6 |
| Frontend Structure | Monorepo (Rails + React) |
| Payment | Razorpay (Free/Plus/Strategist tiers) |

## Next Immediate Actions

1. Create Rails 8 API backend in `./backend`
2. Create React + TypeScript + Vite frontend in `./frontend`
3. Create Docker Compose with all 5 services
4. Set up GitHub Actions CI pipeline
5. Configure Kamal 2 deployment config stub
6. Set up monorepo root package.json with workspace config
7. Verify full stack starts with `docker compose up`