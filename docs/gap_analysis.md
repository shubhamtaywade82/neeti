# Neeti Gap Analysis Report

**Date:** 2026-06-09
**Ferment:** Neeti Gap & Refactor (019eab7c-03ef-76c6-9b3c-6d64d3112f83)
**Source Documents:** `complete_plan.md` (review), `implementation_plan_requirements.md` (original)
**Current Status:** 60 RSpec examples passing, Rails 8 + PostgreSQL + React stack

---

## Executive Summary

The Neeti codebase aligns with the `complete_plan.md` review's **technology stack** (Rails/PostgreSQL/Ollama, rejecting Python/LangGraph/Qdrant/Neo4j). However, it deviates significantly from the review's **data architecture** recommendations. The most critical gaps are:

1. **Schema uses array columns** where normalized join tables are required
2. **Agent is monolithic** where tool-calling architecture is recommended
3. **Reflection runs unconditionally** where conditional reflection is recommended
4. **No evaluation framework** exists to measure retrieval quality
5. **No CAG mode** exists despite the tiny corpus size (455 sutras)

The frontend API contract is stable and well-designed. Frontend UX has minor bugs (conversation loading, sidebar refresh) that are outside this ferment's scope.

---

## 1. Schema Deviations

### 1.1 Array Columns Instead of Normalized Join Tables
**Severity:** CRITICAL  
**Source:** `complete_plan.md` — "Use normalized tables. No arrays. Pure relational design."

**Current State:** `db/migrate/20260101000001_create_sutras.rb`
```ruby
t.text :themes,     array: true, default: []
t.text :virtues,    array: true, default: []
t.text :vices,      array: true, default: []
t.text :situations, array: true, default: []
t.text :emotions,   array: true, default: []
```

**Required State:**
```ruby
# Join tables
sutra_themes     (sutra_id, theme_id)
sutra_virtues    (sutra_id, theme_id)
sutra_vices      (sutra_id, theme_id)
sutra_situations (sutra_id, theme_id)
sutra_emotions   (sutra_id, theme_id)
```

**Impact:**
- Array `&&` operators (`themes && ARRAY[?]::text[]`) are not explainable and scale poorly
- Cannot efficiently query "find all sutras related to greed ordered by chapter grouped by virtue"
- The review explicitly states: "Relational joins scale much better than arrays"
- GIN indexes on arrays are PostgreSQL-specific and harder to maintain

**Remediation:**
- Create 5 join table migrations
- Migrate existing array data into join tables
- Update `Sutra` model associations (replace `by_theme`/`by_virtue` scopes with joins)
- Update `Retriever` queries (Layer 1 metadata, Layer 3 LLM, Layer 4 graph)
- Update `Theme.expand_related` to use recursive CTEs properly

---

### 1.2 Theme Relationships Stored as Array
**Severity:** CRITICAL  
**Source:** `complete_plan.md` — "Replace Theme Graph Arrays. Bad for traversal. Use theme_relationships table."

**Current State:** `db/migrate/20260101000002_create_themes.rb`
```ruby
t.text :related_theme_names, array: true, default: []
```

**Required State:**
```ruby
create_table :theme_relationships do |t|
  t.references :source_theme,  null: false, foreign_key: { to_table: :themes }
  t.references :target_theme,  null: false, foreign_key: { to_table: :themes }
  t.string     :relationship_type, default: 'related'
  t.float      :weight, default: 1.0
end
```

**Impact:**
- Graph traversal on text arrays is fragile and slow
- No relationship type semantics (causes, leads_to, opposes, blocks)
- No edge weights for ranking
- Recursive CTEs must join on text names rather than indexed foreign keys

**Remediation:**
- Create `theme_relationships` migration with unique index on `[source_theme_id, target_theme_id, relationship_type]`
- Migrate existing `related_theme_names` into rows
- Update `Theme.expand_related` to use recursive CTE on `theme_relationships` with indexed FK joins
- Add seed data for relationship types (causes, leads_to, opposes, blocks)

---

### 1.3 Trigger-Based tsvector Instead of Generated Column
**Severity:** MEDIUM  
**Source:** `complete_plan.md` — "Use PostgreSQL generated columns... No callbacks. No sync issues."

**Current State:** Manual trigger function `sutras_search_vector_update()` and trigger.

**Required State:**
```sql
search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(translation_en,''))
) STORED
```

**Impact:**
- Trigger logic is imperative and harder to audit
- Generated columns are declarative and PostgreSQL-native
- Trigger must be recreated on schema changes; generated column is automatic
- Trigger currently depends on array functions (`array_to_string`) which will break after normalization

**Remediation:**
- Drop trigger and function
- Add generated tsvector column (must rebuild TSVECTOR expression to use subqueries/aggregates from join tables)
- Note: `generated always` in migration uses `ActiveRecord::Migration` — use a generated virtual column or raw SQL)
- Rebuild GIN index on new column

---

## 2. Agent Architecture Deviations

### 2.1 Monolithic Agent Instead of Tool-Calling
**Severity:** CRITICAL  
**Source:** `complete_plan.md` — "Introduce Tool Calling Early... Then use actual tool calling through your ollama-client gem."

**Current State:** `lib/neeti/agent.rb` — single `advise()` method with inline calls:
```ruby
sutras   = @retriever.retrieve(query)
insights = MemoryStore.retrieve_insights(user)
messages = build_messages(...)
draft    = @provider.chat(...)
reflection = reflect(draft, ...)
final = reflection[:good] ? draft : refine(...)
```

**Required State:** Explicit tool classes:
```ruby
TOOLS = [
  AnalyzeProblemTool,   # Input: query → Output: {themes, virtues, vices}
  RetrieveSutrasTool,   # Input: query, modes → Output: {sutras}
  ExpandThemesTool,     # Input: themes, depth → Output: {expanded_themes}
  SearchMemoryTool,     # Input: user_id → Output: {insights}
  GenerateReflectionTool # Input: draft, query, sutras → Output: {good, issues, score}
]
```

**Impact:**
- Monolithic agent is not testable per-step
- Cannot observe or log individual reasoning steps
- Cannot selectively instrument retrieval vs generation
- The review explicitly states: "Not: Prompt Engineering. Architecture: User → Planner → Tool Calls → Observations → Final Answer"

**Remediation:**
- Extract `Analyzer`, `Retriever`, `Expander`, `MemorySearch`, `Reflector` into discrete callable objects
- Each tool exposes `.call(inputs) → outputs` interface
- Agent orchestrates tool pipeline with state passing
- Tools are individually unit-testable
- LLM can be prompted with tool definitions for native tool calling via `ollama-client`

---

### 2.2 Unconditional Reflection (Expensive)
**Severity:** HIGH  
**Source:** `complete_plan.md` — "Reflection only for: ambiguous queries, conflicting sutras, low confidence retrieval"

**Current State:** `Agent#advise` calls `reflect()` on **every** query, doubling LLM token usage.

**Required State:**
```ruby
draft = @provider.chat(messages: messages, stream: stream_proc)
confidence = score_confidence(draft, query, sutras)
if confidence < 0.7
  reflection = reflect(draft, query, sutras)
  final = reflection[:good] ? draft : refine(...)
else
  final = draft
end
```

**Impact:**
- Every query incurs 2 LLM calls (draft + reflection)
- At ~100 queries/day, this doubles API costs
- Most simple queries don't need reflection

**Remediation:**
- Add confidence scoring step after draft generation
- Confidence can be heuristic (number of sutras cited / draft length) or LLM-based (1 prompt, cheap model)
- Threshold configurable (default 7/10)
- Skip reflection/refine when confidence ≥ threshold

---

### 2.3 No CAG (Cache-Augmented Generation) Mode
**Severity:** MEDIUM  
**Source:** `complete_plan.md` — "For only 455 sutras... Modern models can hold that. Therefore add CorpusCache."

**Current State:** Always uses 4-layer retrieval, returning ≤5 sutras.

**Required State:**
```ruby
CorpusCache.current # loaded at startup, 455 sutras ~70k-100k tokens
# Mode A: CAG (deep synthesis)
if query_type == :deep_synthesis && corpus_fits_context?
  use_corpus = true
  sutras = CorpusCache.all
else
  use_corpus = false
  sutras = Retriever.retrieve(query)
end
```

**Impact:**
- Missed opportunity for comparative analysis across all sutras
- Deep synthesis queries only see ≤5 sutras
- The review says: "CAG is one of the strongest 2026 patterns"

**Remediation:**
- Add `CorpusCache` singleton preloaded at boot
- Estimate tokens (corpus size + prompt overhead)
- Gate on model context limit (e.g., 32k for Claude, 128k for GPT-4)
- Trigger via query classification ("compare all sutras on greed" vs "quick advice on laziness")

---

### 2.4 Shallow Memory (Missing Reflections Layer)
**Severity:** MEDIUM  
**Source:** `complete_plan.md` — "Missing episodic memory. I would add: conversations, messages, insights, reflections"

**Current State:** Only `Conversation` + `Message` + `UserInsight` tables.

**Required State:** `Reflection` model for agent self-evaluation:
```ruby
create_table :reflections do |t|
  t.references :conversation, null: false
  t.text       :advice_quality_notes
  t.text       :user_satisfaction_signal
  t.timestamps
end
```

**Impact:**
- Agent cannot learn which advice patterns worked well
- No meta-learning loop

**Remediation:**
- Add `Reflection` model linked to conversation
- Store reflection_score history
- Use insight + reflection together for future personalization
- Deferred to post-beta if needed

---

## 3. Missing Evaluation Framework

**Severity:** CRITICAL  
**Source:** Both plans — "Most RAG projects fail because nobody measures retrieval quality."

**Current State:** Zero evaluation. 60 unit/integration tests exist but no benchmark dataset.

**Required State:**
```ruby
spec/evaluation/benchmark_spec.rb
```
With ≥30 queries like:
```text
"I procrastinate constantly" → expected_themes: [laziness, discipline], expected_sutras: [CN_3_14]
"My friend betrayed me"      → expected_themes: [trust, friendship], expected_sutras: [...]
```

Metrics: `Recall@5`, `Recall@10`, `Theme Precision`, `Answer Quality`

**Impact:**
- Cannot detect regressions when changing prompts, models, or schema
- Cannot prove retrieval quality to stakeholders
- Cannot A/B test retrieval strategies

**Remediation:**
- Create 30-100 benchmark scenarios covering all major themes
- Build evaluation runner in Ruby (not Python)
- Measure: retrieval precision/recall, theme accuracy, citation coverage, style adherence
- Run in CI on every PR
- golden dataset committed to repo under `spec/evaluation/`

---

## 4. API Contract Stability Assessment

**Status:** STABLE  
**Risk:** LOW

The backend API contract is well-designed and **no changes are required** for this refactor.

| Endpoint | Status | Risk |
|---|---|---|
| `POST /api/v1/advice` (SSE) | Stable | Low |
| `GET /api/v1/conversations` | Stable | Low |
| `GET /api/v1/conversations/:id` | Stable | Low |
| `DELETE /api/v1/conversations/:id` | Stable | Low |
| `GET /api/v1/conversations/:id/messages` | Stable | Low |
| `POST /api/v1/auth/register` | Stable | Low |
| `POST /api/v1/auth/login` | Stable | Low |
| `GET /api/v1/auth/me` | Stable | Low |
| `GET /api/v1/subscriptions/plans` | Stable | Low |
| `POST /api/v1/subscriptions` | Stable | Low |
| `POST /api/v1/subscriptions/webhook` | Stable | Low |

**Invariant preserved:** SSE event shapes (`token`, `complete`, `error`) and their payload fields will not change.

---

## 5. Frontend Status (Out of Scope)

**Status:** Mostly complete. Two critical UX bugs identified:

1. **ChatWindow does not fetch existing messages** when `conversationId` prop changes. Messages are local-only.
2. **ConversationSidebar does not refresh** after a new conversation is created via SSE.

These are not within the current ferment scope but are noted for a future frontend-focused phase.

---

## 6. Prioritized Remediation Plan

### Phase 1: Schema Normalization (Week 1)
- [ ] Create join tables + theme_relationships migration
- [ ] Migrate array data to normalized tables
- [ ] Update models, triggers, seeds
- [ ] Verify all model specs pass

### Phase 2: Retrieval Engine Update (Week 1-2)
- [ ] Rewrite retriever to use joins/CTEs
- [ ] Update Theme.expand_related with proper recursive CTE
- [ ] Ensure 4-layer retrieval still works end-to-end

### Phase 3: Agent Refactor (Week 2)
- [ ] Extract tool classes from monolithic agent
- [ ] Implement confidence scoring + conditional reflection
- [ ] Add CorpusCache + CAG mode

### Phase 4: Evaluation Framework (Week 2-3)
- [ ] Create 30-100 benchmark queries
- [ ] Build evaluation runner with precision/recall
- [ ] Integrate into CI

### Phase 5: Regression Gate (Week 3)
- [ ] Run full test suite (existing + new)
- [ ] Verify API contract preserved
- [ ] Verify seeds work post-migration
- [ ] Verify migration reversibility

---

## 7. Key Decisions Logged

1. **Authority:** `complete_plan.md` (review) is authoritative over `implementation_plan_requirements.md`. The original Python/LangGraph/Qdrant/Neo4j recommendations are rejected.
2. **Scope:** All 10 acceptance criteria confirmed by user. Full implementation, not just report.
3. **Schema arrays → normalized tables:** Required despite migration complexity. This is the foundation for everything else.
4. **Generated tsvector → optional:** The `GENERATED ALWAYS` tsvector requires complex subqueries for joined data. The trigger approach may actually be simpler post-normalization. Decision: keep trigger pattern but update to use join tables; revisit generated columns as future optimization if performance demands.
5. **CAG corpus caching:** Preload at startup via singleton. For 455 sutras, this is trivial memory cost.
6. **Evaluation approach:** Ruby-native benchmark runner, not Python. Keep stack consistent.

---

*End of Gap Analysis Report*
