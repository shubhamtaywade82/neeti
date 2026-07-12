# Knowledge OS (KOS) — Implementation Plan v0.1

## Current State → Target State

**Project:** Neeti → **Knowledge OS (KOS)**

**Status:** Neeti already has ~50% of the KOS MVP built (auth, chat, curated Chanakya knowledge, RAG pipeline, subscriptions). This plan bridges the gap.

---

## Phase 0 — Rebrand: Neeti → Knowledge OS

**Goal:** Apply KOS identity to the existing application. Visual and naming changes only — no structural changes.

### Design Tokens

| Token | Neeti (Current) | KOS (Target) |
|-------|-----------------|--------------|
| Primary | Saffron (orange) #f57c1b | Indigo #4F46E5 |
| Background | #06050b | #0F172A |
| Surface | #1e293b | #1E293B |
| Accent | (same as primary) | Emerald #10B981 |
| Error | #EF4444 | #EF4444 |
| Display Font | Playfair Display | Inter (or keep Playfair) |
| Body Font | Inter | Inter |

### Files to Change

| File | Change |
|------|--------|
| `frontend/tailwind.config.ts` | Replace saffron palette with indigo/kos palette |
| `frontend/src/index.css` | Replace CSS variables, animations, utility classes |
| `frontend/src/components/AppShell.tsx` | KOS logo, nav labels, brand references |
| `frontend/src/pages/LoginPage.tsx` | KOS branding, Devanagari → English |
| `frontend/src/pages/RegisterPage.tsx` | KOS branding |
| `frontend/src/pages/DashboardPage.tsx` | Welcome text, branding |
| `frontend/src/pages/PacksPage.tsx` | Header labels |
| `frontend/src/pages/SettingsPage.tsx` | Brand references |
| `frontend/src/pages/ChatPage.tsx` | Brand references |
| `frontend/src/pages/GraphPage.tsx` | Brand references |
| `frontend/src/pages/SutrasPage.tsx` | Brand references |
| `frontend/src/pages/MemoryPage.tsx` | Brand references |
| `frontend/src/pages/AdminPage.tsx` | Brand references |
| `frontend/index.html` | Title, meta tags |
| `frontend/neeti_mockup.html` | Remove/archive |
| `frontend/neeti.jsx` | Remove/archive |

### Naming Migration

| Current | New |
|---------|-----|
| Neeti | Knowledge OS |
| saffron-* | primary-* (indigo tones) |
| wisdom-* | surface-* (slate tones) |
| AI Advisor | AI Chat |
| Knowledge Packs | Library |
| Sutra Browser | Browse |
| Graph Explorer | Knowledge Graph |
| Memory & Insights | Memory |

**Effort:** 1 week

---

## Phase 1 — Multi-Pack Library System

**Goal:** Abstract knowledge from Chanakya-only to multiple curated packs with a shared retrieval architecture.

### Database Changes

#### New Model: `KnowledgePack`
```
id, name, slug, description, icon, color, author,
version, visibility (system/user), metadata (jsonb),
created_at, updated_at
```

#### Modified Model: `Sutra` → Add `pack_id`
```
Add: pack_id (references knowledge_packs)
Add: source_type polymorphic column (for future doc types)
```

Alternatively, keep `Sutra` as Chanakya-specific and create a generic `KnowledgeItem` model. Decision needed.

### Data Seeding

Pre-seed 5-8 curated packs as structured JSON files in `db/seeds/`:

| Pack | Source | Format |
|------|--------|--------|
| Chanakya Neeti | Existing sutras_data.json | Already seeded |
| Bhagavad Gita | 700 verses text | JSON with chapter/verse |
| Stoic Meditations | Marcus Aurelius meditations | JSON with book/paragraph |
| The Art of War | Sun Tzu 13 chapters | JSON with chapter/verse |
| Atomic Habits | James Clear frameworks | JSON with concept/principle |
| Arthashastra | Kautilya (premium) | JSON with book/section |

### Architecture Change

Current (monolithic):
```
Sutra table → All Chanakya content
Retriever → Only queries Sutra
Agent → Only uses Chanakya prompt
```

Target (multi-pack):
```
KnowledgePack
  └── KnowledgeItems (polymorphic: Sutra, GitaVerse, StoicPassage, etc.)

Retriever → Queries across user's installed packs
Agent → Uses pack-specific prompt + shared retrieval
```

### Retrieval Changes

The current 4-layer retriever is Chanakya-specific (theme synonyms, sutra tables). For multi-pack:

1. **Layer 1 (FTS)** — Already generic via `search_vector` or `tsvector` on content
2. **Layer 2 (Metadata)** — Abstract theme/tag system per pack
3. **Layer 3 (LLM classifier)** — Already generic (classify → map to tags)
4. **Layer 4 (Graph)** — Per-pack knowledge graph (pack-specific theme_relationships)

### Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/packs` | GET | List available packs |
| `/api/v1/packs/:id` | GET | Pack detail with items |
| `/api/v1/packs/install` | POST | Install pack for user |
| `/api/v1/packs/uninstall` | POST | Uninstall pack |

**Effort:** 2-3 weeks

---

## Phase 2 — Personal Workspace (Document Upload & RAG)

**Goal:** Users can upload their own documents (PDF, Markdown, TXT, DOCX) and chat with them. This is the core differentiator.

### Database Changes

#### New Model: `Collection`
```
id, user_id, name, description, icon, slug, position,
created_at, updated_at
```

#### New Model: `Document`
```
id, user_id, collection_id (optional), filename,
title, file_type (pdf/md/txt/docx), file_size,
storage_key (S3 path), page_count, status (processing/ready/error),
error_message, token_count, metadata (jsonb),
created_at, updated_at
```

#### New Model: `DocumentChunk`
```
id, document_id, content, position, token_count,
embedding (vector: pgvector), created_at
```

#### New Join: `ChatDocument` (optional)
Link chats to documents used as context for retrieval transparency.

### Processing Pipeline

```
Upload → Validate (type, size) → Store (S3/disk) → 
Extract Text (pdf-reader/docx gem) → Clean → 
Chunk (recursive, 512-1024 tokens) → Embed (BGE/Nomic via Ollama) →
Store pgvector → Mark document as "ready"
```

### Gems to Add

| Gem | Purpose |
|-----|---------|
| `pdf-reader` or `hexapdf` | PDF text extraction |
| `docx` or `mammoth` | DOCX text extraction |
| `redcarpet` or `commonmarker` | Markdown parsing |
| `pgvector` | Vector storage in PostgreSQL |
| `activestorage` | File storage (rails built-in) |

### Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/collections` | GET/POST | List/create collections |
| `/api/v1/collections/:id` | GET/PATCH/DELETE | Collection CRUD |
| `/api/v1/collections/:id/documents` | GET | Documents in collection |
| `/api/v1/documents` | GET/POST | List/upload documents |
| `/api/v1/documents/:id` | GET/PATCH/DELETE | Document CRUD |
| `/api/v1/documents/:id/status` | GET | Processing status |
| `/api/v1/documents/:id/chunks` | GET | Document chunks (debug) |

### Enhanced RAG Pipeline

Current: Only queries `sutras` table → Chanakya
Target: Queries across `sutras` (library) + `document_chunks` (user docs)

```
User Query
  ↓
Embed query with same model
  ↓
Vector search across:
  ├── library_items (curated packs, installed by user)
  └── document_chunks (user uploads, filtered by collection)
  ↓
Merge & rerank (top-k = 5, max context = 6K tokens)
  ↓
Build context with citations
  ↓
LLM generates answer
```

### Chat Scope Selector

Users choose what their chat has access to:
- Entire Library (all installed packs)
- My Documents (all personal docs)
- Specific Collection
- Specific Pack
- Combined (library + personal)

### Frontend

| Screen | What to Build |
|--------|---------------|
| Collections page | List/create/rename/delete collections |
| Collection detail | Documents grid, metadata |
| Documents page | Grid/list toggle, search, filter |
| Upload modal | Drag-and-drop, progress, validation |
| Document detail | Preview, metadata, actions |
| Chat scope selector | Dropdown/picker for context source |

**Effort:** 3-4 weeks

---

## Phase 3 — Global Semantic Search

**Goal:** Single search interface across all knowledge (library + personal + chats).

### Backend

```
POST /api/v1/search
  params: query, scope (all/library/personal/chats), 
          type (document/chat/pack), collection_id, 
          page, per_page
  returns: grouped results with highlighted snippets
```

### Search Architecture

Hybrid search:
1. Vector similarity (cosine on embeddings)
2. Full-text search (tsvector/PostgreSQL)
3. Combined with weighted scoring

### Frontend

- Spotlight overlay (Cmd+K) — always accessible from header
- Search page with advanced filters
- Results grouped by category (Documents, Chats, Packs, Collections)

**Effort:** 1-2 weeks

---

## Phase 4 — Usage Limits & Observability

**Goal:** Prevent abuse, track costs, display usage to users.

### Database

#### New Model: `DailyUsage`
```
id, user_id, date, input_tokens, output_tokens,
search_count, upload_count, storage_bytes,
embedding_chars, created_at, updated_at
```

### Token Budget System

| Tier | Input/Day | Output/Day | Total |
|------|-----------|------------|-------|
| Anonymous | 25K | 12.5K | 37.5K |
| Free | 150K | 75K | 225K |
| Pro (future) | 500K | 250K | 750K |

Each request calculates:
```
cost = prompt_tokens + retrieved_context + completion_tokens
```

### Rate Limits

| Scope | Limit |
|-------|-------|
| Requests | 30/min, 300/hour, 1000/day |
| Concurrent generations | 1 active + 2 queued per user |
| Global concurrent | GPU-dependent (4-6 on RTX 4090) |
| Streaming timeout | 90 seconds |
| Queue wait | max 60 seconds |

### File & Upload Limits

| Resource | Limit |
|----------|-------|
| Max file size | 20 MB (PDF/DOCX), 5 MB (Markdown) |
| Total files | 20 per user |
| Embedding | 500K chars/day |
| Indexed pages | 500 pages/day |

### Frontend Usage Dashboard

- Token usage bar (input/output split)
- Message count
- Storage used
- Upload quota
- Search count
- Upgrade prompts when limits approached

**Effort:** 1-2 weeks

---

## Phase 5 — Launch Readiness

**Goal:** Production polish, monitoring, deployment.

### Error Handling
- Global error boundary in React
- Toast notifications for all API errors
- Retry logic for failed uploads
- Graceful degradation when Ollama is down

### Empty States
Every page needs an empty state with:
- Illustration/icon
- Descriptive message
- Call-to-action button

### Loading States
- Skeleton loaders for all list/grid views
- Progress indicators for upload processing
- Streaming indicator for chat

### Responsive Design
- Mobile bottom navigation (Home, Search, Chat, Documents, Profile)
- Collapsible sidebar
- Touch-friendly targets

### SEO
- Meta tags for all public pages
- Open Graph images
- Sitemap

### Monitoring
- Sentry for error tracking
- Request logging (structured JSON)
- Key metrics: DAU, uploads, searches, chats, token usage, latency, error rate

### Deployment
- Kamal 2 for Rails backend
- Static build for frontend (Vercel/Cloudflare Pages)
- CI/CD with GitHub Actions

**Effort:** 1-2 weeks

---

## Sprint Breakdown

### Sprint 1 (Week 1-2): Rebrand + Authentication Polish
- [ ] Update Tailwind config with KOS design tokens
- [ ] Update CSS variables and utility classes
- [ ] Update AppShell with KOS branding
- [ ] Update Login/Register with KOS design
- [ ] Update Dashboard with KOS welcome
- [ ] Update all pages with KOS naming
- [ ] Update HTML title and meta tags
- [ ] Add Google OAuth (optional)
- [ ] Email verification flow

### Sprint 2 (Week 3-4): Multi-Pack Library
- [ ] Create KnowledgePack model and migration
- [ ] Add pack_id to content entities
- [ ] Seed Bhagavad Gita data
- [ ] Seed Stoic Meditations data
- [ ] Seed Art of War data
- [ ] Abstract retriever to query across packs
- [ ] Add pack-scoped agent routing
- [ ] Update packs API
- [ ] Build Library page UI
- [ ] Build Library collection detail page

### Sprint 3 (Week 5-7): Personal Workspace
- [ ] Add pgvector extension
- [ ] Create Collection model and migration
- [ ] Create Document model and migration
- [ ] Create DocumentChunk model and migration
- [ ] Add pdf-reader gem
- [ ] Add docx gem
- [ ] Build upload API endpoint
- [ ] Build document processing pipeline (extract → chunk → embed)
- [ ] Configure ActiveStorage (S3-compatible)
- [ ] Build Collections UI (list, create, detail)
- [ ] Build Documents UI (grid, upload modal, preview)
- [ ] Build document-enhanced RAG pipeline
- [ ] Build chat scope selector
- [ ] Update citations to support user docs

### Sprint 4 (Week 8-9): Global Search + Usage Limits
- [ ] Build search API with hybrid retrieval
- [ ] Build spotlight search overlay (Cmd+K)
- [ ] Build search page with filters
- [ ] Create DailyUsage model
- [ ] Implement token budget tracking
- [ ] Implement rate limiting
- [ ] Implement concurrent generation lock
- [ ] Build usage dashboard UI
- [ ] Add anonymous user tracking

### Sprint 5 (Week 10): Launch Readiness
- [ ] Add error boundaries to all pages
- [ ] Add empty states to all pages
- [ ] Add loading skeletons
- [ ] Mobile responsive pass
- [ ] SEO meta tags
- [ ] Sentry integration
- [ ] Production deploy
- [ ] Landing page copy polish

---

## Architecture Decisions

### 1. Vector Store: pgvector vs Qdrant

**Decision: pgvector (MVP)**

Rationale:
- Already using PostgreSQL — no new infrastructure
- Good enough for MVP scale (<100K chunks)
- Simpler deployment (no separate service)
- Can migrate to Qdrant/Weaviate at scale

### 2. File Storage: ActiveStorage vs direct S3

**Decision: ActiveStorage with S3-compatible backend**

Rationale:
- Rails-native, zero additional gems
- Easy migration between backends (local dev → S3 → Cloudflare R2)
- Built-in validations, direct uploads, variants

### 3. Document Processing: Sync vs Background Jobs

**Decision: Background jobs (Solid Queue)**

Rationale:
- Already using Solid Queue for InsightExtractionJob
- Document processing can take 10-30 seconds for large PDFs
- Users shouldn't wait for embedding to complete
- WebSocket/polling for status updates

### 4. Embedding Model: BGE vs Nomic vs Ollama

**Decision: Ollama-hosted embedding (BGE or Nomic)**

Rationale:
- Already running Ollama locally
- No additional API costs
- BGE-small-en-v1.5 (384 dim) for speed, or Nomic (768 dim) for accuracy
- Consistent with existing architecture

### 5. Chunking Strategy

| Parameter | Value |
|-----------|-------|
| Chunk size | 512 tokens |
| Overlap | 128 tokens |
| Strategy | Recursive character split |
| Embedding model | BGE-small-en-v1.5 (384d) |

---

## Success Criteria

### Functional

- [ ] User can sign up and log in
- [ ] User sees curated knowledge packs in Library
- [ ] User can install/uninstall packs
- [ ] User can chat with installed packs
- [ ] User can upload PDF/MD/TXT/DOCX
- [ ] Documents are processed within 30 seconds (small files)
- [ ] User can chat with their documents
- [ ] Answers include source citations
- [ ] Global search returns relevant results
- [ ] Usage limits are enforced
- [ ] Usage dashboard displays correctly

### Performance

| Metric | Target |
|--------|--------|
| Page load | <2 seconds |
| Search | <500ms |
| First chat token | <2 seconds |
| Average response | <8 seconds |
| Upload processing | <30 seconds (10-page PDF) |

### Quality

- All existing RSpec tests pass
- New features have request specs
- Frontend builds without errors
- Responsive on mobile (320px+)
- No console errors

---

## Future Phases (Post-MVP)

| Phase | Product | Timeline |
|-------|---------|----------|
| v0.2 | KOS Workspace (tags, sharing, folders) | Sprint 6-7 |
| v0.3 | KOS Research (automated reports) | Sprint 8-9 |
| v0.4 | KOS Memory (persistent AI memory) | Sprint 10-11 |
| v1.0 | Unified platform | Sprint 12+ |

---

## Appendix: Current Asset Reuse

| Neeti Feature | Reuse in KOS | Changes Needed |
|---------------|--------------|----------------|
| JWT auth | Full reuse | None |
| User model | Full reuse | Add anonymous tracking |
| Conversations | Full reuse | Link to documents |
| Messages | Full reuse | Add doc citations |
| Sutra model | Refactor to KnowledgeItem | Add pack_id |
| Theme model | Refactor to Tag | Make generic |
| Retriever | Refactor | Add doc chunk query |
| Agent | Refactor | Multi-pack + doc context |
| ModelRouter | Full reuse | None |
| Ollama provider | Full reuse | Add embeddings |
| PacksController | Full reuse | Add DB backing |
| GraphController | Refactor | Per-pack graph |
| UserInsights | Full reuse | None |
| Subscriptions | Full reuse | Add KOS plans |
| Admin | Full reuse | Add doc management |
