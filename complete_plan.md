The architecture is directionally correct, but I would change several things before building it.

# Decision

**Use Structured RAG as the primary retrieval mechanism.**

For 455 Chanakya Neeti sutras, I would **not build a vector-first architecture**.

However, I would **not completely eliminate embeddings either**.

My recommendation:

```text
Tier 1 → Structured Retrieval (Postgres)
Tier 2 → Full Text Search (Postgres)
Tier 3 → Theme Graph Expansion
Tier 4 → Optional Embeddings (pgvector)
```

Embeddings become a fallback, not the primary source.

This gives:

* explainability
* deterministic retrieval
* low cost
* future-proofing

---

# What I Would Change

## 1. Do Not Store Arrays

Instead of:

```ruby
t.string :themes, array: true
t.string :virtues, array: true
t.string :vices, array: true
```

Use normalized tables.

```ruby
create_table :themes do |t|
  t.string :name
  t.string :category
end

create_table :sutra_themes do |t|
  t.references :sutra
  t.references :theme
end
```

Why?

Because later you'll need:

```sql
Find all sutras related to greed
ordered by chapter
grouped by virtue
```

Relational joins scale much better than arrays.

---

# 2. Replace Theme Graph Arrays

Current:

```ruby
related_theme_names: []
```

Bad for traversal.

Use:

```ruby
create_table :theme_relationships do |t|
  t.references :source_theme
  t.references :target_theme

  t.string :relationship_type
end
```

Examples:

```text
greed -> attachment
attachment -> suffering
discipline -> success
```

Then recursive CTEs become natural.

```sql
WITH RECURSIVE ...
```

---

# 3. Use Generated tsvector

Instead of:

```ruby
t.tsvector :search_vector
```

Use PostgreSQL generated columns.

```sql
search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'english',
    coalesce(translation_en,'') || ' ' ||
    coalesce(sanskrit,'')
  )
) STORED
```

and

```sql
GIN(search_vector)
```

No callbacks.

No sync issues.

---

# 4. Memory Needs Two Layers

Current design:

```text
conversation_messages
user_insights
```

Missing episodic memory.

I would add:

```ruby
conversations
messages
insights
reflections
```

Example:

```text
Insight:
User struggles with procrastination.

Reflection:
Advice around discipline worked well.
```

This improves future responses dramatically.

---

# 5. Agent Reflection Is Too Expensive

Current:

```text
Plan
Execute
Draft
Reflect
Refine
```

Every query.

That doubles token usage.

Instead:

```ruby
if confidence < 0.7
  reflect
else
  return draft
end
```

Reflection only for:

* ambiguous queries
* conflicting sutras
* low confidence retrieval

---

# 6. Ollama Model Choice

I would not start with:

```text
llama3.3:70b
```

For most deployments:

```text
qwen3:32b
```

or

```text
qwen3:30b-a3b
```

will provide:

* faster inference
* lower VRAM
* similar philosophical reasoning

Keep:

```text
OpenAI GPT-4o-mini
Claude
```

as fallback.

---

# 7. Introduce Tool Calling Early

Your router currently only routes chat.

I would define:

```ruby
TOOLS = [
  RetrieveSutras,
  QueryThemes,
  SearchMemory,
  GenerateReflection
]
```

Then use actual tool calling through your `ollama-client` gem.

Architecture:

```text
User
 ↓
Planner
 ↓
Tool Calls
 ↓
Observations
 ↓
Final Answer
```

Not:

```text
Prompt Engineering
```

---

# 8. Add Evaluation Framework

Most RAG projects fail because nobody measures retrieval quality.

Create:

```ruby
evaluation_queries
evaluation_results
```

Example:

```text
Query:
"I am lazy at work"

Expected themes:
- laziness
- discipline
- effort

Expected sutra:
CN_3_14
```

Run nightly.

Measure:

```text
Recall@5
Recall@10
Theme Precision
Answer Quality
```

---

# Missing Component: CAG

You mentioned Cache-Augmented Generation.

For only 455 sutras:

```text
455 sutras
≈ 150-250 tokens each
≈ 70k-100k tokens
```

Modern models can hold that.

Therefore add:

```ruby
CorpusCache.current
```

loaded at startup.

For some queries:

```ruby
if corpus_size < context_limit
  use CAG
else
  use retrieval
end
```

This is one of the strongest 2026 patterns.

---

# Rails Architecture I Would Build

```text
app/
├── agents/
│   ├── advisor_agent.rb
│   ├── planner.rb
│   ├── reflector.rb
│
├── services/
│   ├── llm_router.rb
│   ├── retrieval/
│   │   ├── metadata_retriever.rb
│   │   ├── fts_retriever.rb
│   │   ├── graph_retriever.rb
│   │   └── hybrid_retriever.rb
│
├── models/
│   ├── sutra.rb
│   ├── theme.rb
│   ├── theme_relationship.rb
│   ├── insight.rb
│   └── conversation.rb
│
├── jobs/
│   ├── insight_extraction_job.rb
│   └── evaluation_job.rb
│
├── controllers/
│   └── api/v1/chat_controller.rb
```

---

# Build Order

I would generate components in this exact order:

### Phase 1

```text
Database schema
Models
Associations
Seeds
```

### Phase 2

```text
Metadata Retriever
FTS Retriever
Graph Retriever
Hybrid Retriever
```

### Phase 3

```text
LLM Router
Ollama Integration
Tool Calling
```

### Phase 4

```text
Advisor Agent
Memory Store
Reflection
```

### Phase 5

```text
Streaming API (SSE)
React Chat UI
```

### Phase 6

```text
Evaluation Framework
Admin Dashboard
Analytics
```

If I were implementing Neeti from scratch today, I would start with the **Rails backend first** and build:

1. Complete PostgreSQL schema
2. Theme graph
3. Structured retriever
4. LLM router
5. Agent runtime

Only after retrieval quality is proven would I build the React PWA. The backend retrieval and reasoning layer is the highest-risk part of the system; the UI is comparatively straightforward.

The business analysis is good, but there are a few technical recommendations I strongly disagree with.

# What I Agree With

## 1. Freemium → Subscription

Correct.

For India, I would actually use:

| Tier       | Price         |
| ---------- | ------------- |
| Free       | 5 queries/day |
| Seeker     | ₹149/month    |
| Strategist | ₹399/month    |
| Raja       | ₹1499/month   |

₹199 → ₹499 → ₹1999 is slightly aggressive for a brand-new product.

---

## 2. Daily Sutra Habit Loop

This is probably the single most important product feature.

Most AI apps fail because:

```text
User asks question
Gets answer
Leaves forever
```

Daily engagement fixes this.

I'd build:

```text
Morning Sutra
↓
Reflection Question
↓
User Response
↓
Memory Update
↓
Personalized Advice
```

Now Neeti becomes a companion.

---

## 3. Human + AI Hybrid

Strong long-term moat.

But not before 1000+ MAU.

Initially:

```text
AI only
```

Then:

```text
AI + Expert Review
```

Much later:

```text
Marketplace of Coaches
```

---

# What I Disagree With

## 1. Qdrant

The roadmap says:

```text
Month 1
Deploy basic RAG (Qdrant + local LLM)
```

I would not do this.

For 455 sutras:

```text
Qdrant = unnecessary complexity
```

You already have:

```text
Postgres
```

Use:

```sql
tsvector
GIN
recursive CTE
metadata joins
```

Only add pgvector later if retrieval quality proves insufficient.

---

## 2. LangGraph Mention

The plan mentions:

```text
Full LangGraph memory store
```

No.

Your stack is:

```text
Ruby
Rails
Ollama
Postgres
```

Adding:

```text
Python
LangGraph
```

creates an entire second runtime.

Instead:

```ruby
Agent
Planner
ToolExecutor
Reflector
```

inside Rails.

Much simpler.

---

## 3. Neo4j

Roadmap:

```text
Month 6-12
Neo4j knowledge graph
```

Not needed.

You only have:

```text
455 sutras
17 chapters
~100 themes
```

Postgres recursive CTEs will handle this easily.

Example:

```sql
WITH RECURSIVE theme_tree AS (...)
```

No reason to operate:

* PostgreSQL
* Neo4j

for such a small graph.

---

# Biggest Missing Opportunity

The current plan treats Neeti as:

```text
Question → Answer
```

I think the bigger opportunity is:

```text
Question
↓
Diagnosis
↓
Theme Mapping
↓
Advice
↓
Action Plan
↓
Follow-up
```

Example:

User:

```text
I'm procrastinating.
```

Most AI apps:

```text
Here is some advice.
```

Neeti:

```text
Root vice: Laziness

Related vice:
Comfort-seeking

Counter virtue:
Discipline

Relevant sutras:
CN_2_11
CN_3_7
CN_5_3

7-day action plan:
...
```

That's much harder to copy.

---

# Architecture I Would Actually Build

```text
Rails 8
PostgreSQL
Solid Queue
Solid Cache
Solid Cable

React
TypeScript
Vite

Ollama
OpenAI fallback

Structured RAG
Graph Retrieval
Memory Store

No:
- LangChain
- LangGraph
- Pinecone
- Qdrant
- Neo4j
- Redis
```

---

# Revenue Opportunity You're Missing

Neeti should not stop at chat.

Future modules:

### Career Neeti

```text
Career decisions
Leadership
Office politics
Negotiation
```

### Relationship Neeti

```text
Marriage
Friendship
Trust
Conflict
```

### Founder Neeti

```text
Hiring
Competition
Strategy
Delegation
```

### Daily Neeti

```text
Morning sutra
Habit tracking
Reflection
```

Each can be a premium vertical.

---

# If I Were Building This With Your Rails Background

The first artifact I would generate is **not the UI**.

I would build:

```text
1. PostgreSQL schema
2. Sutra importer
3. Theme graph
4. Retrieval engine
5. Agent runtime
6. Evaluation suite
7. API
8. React UI
```

Specifically:

```text
Phase 1 Deliverable:
"Ask a question and get the correct sutras back."
```

Until retrieval precision is proven, everything else (subscriptions, UI polish, marketing) is secondary.

A beautiful chat interface with weak retrieval will fail. A plain interface with highly relevant sutra retrieval can already validate the core product.

This blueprint is technically strong for a **general-purpose enterprise RAG system**, but for **Neeti specifically**, it introduces unnecessary infrastructure and complexity.

My recommendation is different because of your actual constraints:

```text
Corpus Size: ~455 sutras
Users: Initially < 10,000
Stack: Rails + PostgreSQL + Ollama
Goal: Authentic advice with citations
```

Not:

```text
Millions of documents
Petabyte-scale search
Cross-domain enterprise knowledge
```

---

# What I Would Keep

## Hybrid Retrieval Concept

This is valid.

The idea:

```text
Keyword Search
+
Semantic Search
+
Reranking
```

is proven.

For Neeti:

```text
Metadata Match
+
Postgres FTS
+
Optional Embeddings
```

achieves almost the same result.

---

## Rich Sutra Metadata

Absolutely.

I would actually go further.

```ruby
Sutra
  canonical_id
  chapter
  sanskrit
  translation_en
  translation_hi

Theme
Virtue
Vice
Situation
Emotion
Role
Action
```

Example:

```text
CN_3_14

Themes:
- laziness
- effort

Virtues:
- discipline

Vices:
- procrastination

Situations:
- career
- education

Emotions:
- fear
- insecurity
```

This becomes the foundation of retrieval.

---

## Persona Layer

Correct.

This is critical.

Most "philosophy bots" fail because they answer like ChatGPT.

Neeti should answer:

```text
Chanakya first
LLM second
```

Every response should include:

```text
1. Relevant sutra
2. Interpretation
3. Application
4. Reflection question
```

---

## Evaluation Suite

100% agree.

Build before launch.

I would create:

```text
100 benchmark scenarios
```

including:

```text
career
leadership
betrayal
friendship
marriage
money
discipline
fear
ambition
failure
```

Then automatically score retrieval quality.

---

# What I Would NOT Use

## LangGraph

For your stack:

```text
Ruby
Rails
Postgres
Ollama
```

LangGraph introduces:

```text
Python
LangChain
LangGraph
Additional deployment
Additional monitoring
Additional debugging
```

You already build event-driven systems.

A Rails-native state machine is enough.

Example:

```ruby
AdvisorAgent
  -> Analyze
  -> Retrieve
  -> Expand
  -> Generate
  -> Validate
```

No LangGraph required.

---

## Neo4j

This is where I disagree most.

You have:

```text
455 sutras
~100 themes
```

This graph is tiny.

PostgreSQL can easily handle:

```sql
theme_relationships
sutra_themes
recursive CTE
```

Example:

```sql
greed
  -> attachment
  -> suffering
  -> downfall
```

No Neo4j server.

No graph synchronization.

No additional backup strategy.

---

## Qdrant

For Phase 1:

No.

Reason:

```text
Need:
Postgres

Now adding:
Qdrant
```

You now have:

```text
2 databases
2 backup systems
2 deployment systems
2 monitoring systems
```

to search 455 sutras.

Not worth it.

---

## Voyage AI / Cohere Embeddings

Not initially.

Why?

Because Neeti's corpus is unusually structured.

A query:

```text
I'm lazy
```

can already map to:

```text
theme=laziness
virtue=discipline
situation=career
```

without embeddings.

---

# What I Would Build Instead

## Retrieval Stack v1

```text
Layer 1
Metadata Matching

Layer 2
Postgres FTS

Layer 3
LLM Theme Classification

Layer 4
Theme Graph Expansion

Layer 5
Optional Embedding Search
```

Notice:

```text
Embeddings are LAST
not FIRST
```

---

# The Best 2026 Pattern For Neeti

The blueprint mentions CAG.

This is actually the most interesting part.

Because:

```text
455 sutras
≈ 70k-100k tokens
```

Modern models can fit that.

Therefore:

## Mode A — CAG

Load entire corpus.

```text
User Question
↓
Full Corpus
↓
Answer
```

Useful for:

```text
deep reflection
comparative analysis
theme synthesis
```

---

## Mode B — Retrieval

```text
User Question
↓
Retrieve 5-15 sutras
↓
Generate
```

Useful for:

```text
fast responses
cheap inference
mobile usage
```

---

## Mode C — Hybrid

```text
Retrieve
↓
Generate
↓
Verify against full corpus
```

This is probably the strongest architecture.

---

# What I Would Build First

Given your Rails background, I would not start with LangGraph, Neo4j, Qdrant, or embeddings.

I would build:

```text
Phase 1
---------
PostgreSQL Schema
Sutra Importer
Theme Taxonomy

Phase 2
---------
Metadata Retrieval
FTS Retrieval
Graph Expansion

Phase 3
---------
Ollama Integration
Tool Calling

Phase 4
---------
Advisor Agent
Memory System

Phase 5
---------
Evaluation Benchmark

Phase 6
---------
React UI
Payments
Subscriptions
```

Only after measuring retrieval quality would I ask:

```text
Do we actually need embeddings?
```

For a 455-sutra corpus, there is a good chance the answer will be **no**.

If I were architecting Neeti today, I would choose:

```text
Rails 8
PostgreSQL

Structured RAG
+
Knowledge Graph (inside Postgres)
+
CAG fallback
+
Ollama

No LangGraph
No Neo4j
No Qdrant
No Weaviate
No Pinecone
```

That is the smallest architecture that can still deliver an institutional-grade Chanakya advisor.
This summary is useful for a reader, but if your goal is **building Neeti**, it is still too high-level.

You need to transform Chanakya Neeti from a book into a structured knowledge system.

# What Most People Miss

Most implementations store:

```json
{
  "sutra": "...",
  "translation": "..."
}
```

and then run vector search.

That loses most of Chanakya's structure.

For Neeti, each sutra should be decomposed into multiple dimensions.

---

# Recommended Knowledge Model

Instead of:

```ruby
Sutra
  sanskrit
  translation
```

Use:

```ruby
Sutra
  canonical_id
  chapter
  sanskrit
  translation_en
  translation_hi

  primary_themes
  secondary_themes

  virtues
  vices

  situations

  emotions

  actors

  actions

  outcomes

  difficulty_level

  confidence
```

---

# Example

Take:

> Greed is the greatest disease.

Instead of storing as text only:

```json
{
  "id": "CN_01_XX",
  "theme": ["greed"],
  "vice": ["greed"],
  "emotion": ["desire"],
  "situation": [
    "wealth",
    "career",
    "leadership"
  ],
  "opposes": [
    "contentment",
    "detachment"
  ],
  "outcome": [
    "suffering",
    "downfall"
  ]
}
```

Now retrieval becomes deterministic.

---

# Real Taxonomy Needed

I would build a complete ontology.

## Virtues

```text
Discipline
Wisdom
Patience
Courage
Contentment
Humility
Learning
Self-Control
Loyalty
Truthfulness
Generosity
```

---

## Vices

```text
Greed
Laziness
Anger
Pride
Attachment
Jealousy
Foolishness
Fearfulness
Deceit
Impulsiveness
```

---

## Situations

```text
Career
Leadership
Management
Friendship
Marriage
Family
Parenting
Money
Business
Politics
Conflict
Education
Personal Growth
```

---

## Emotions

```text
Fear
Anger
Desire
Envy
Sadness
Hope
Frustration
Confusion
```

---

## Actors

```text
King
Leader
Teacher
Student
Parent
Child
Friend
Enemy
Servant
Advisor
Merchant
```

---

# Knowledge Graph

The graph should not be:

```text
Sutra -> Sutra
```

Instead:

```text
Sutra
  ↓ teaches
Virtue

Virtue
  ↓ opposes
Vice

Vice
  ↓ causes
Outcome

Situation
  ↓ requires
Virtue
```

Example:

```text
Greed
  ↓ causes
Suffering

Contentment
  ↓ opposes
Greed

Career
  ↓ requires
Discipline

Discipline
  ↓ leads_to
Success
```

This graph is far more useful than simply linking sutras together.

---

# What Neeti Actually Answers

The user never asks:

```text
Give me Chapter 3 Sutra 14
```

They ask:

```text
My team ignores me.

My friend betrayed me.

I can't focus.

I am afraid to start a business.

I am jealous of my colleague.
```

Therefore retrieval should begin with:

```text
Problem
↓
Theme
↓
Virtue/Vice
↓
Relevant Sutras
```

Not:

```text
Question
↓
Vector Search
```

---

# I Would Create These Core Tables

```ruby
sutras
themes
virtues
vices
situations
emotions
actors

sutra_themes
sutra_virtues
sutra_vices
sutra_situations
sutra_emotions
sutra_actors

theme_relationships
```

No arrays.

Pure relational design.

---

# Evaluation Dataset You Need

Before writing a single line of AI code:

Create 100 benchmark questions.

Examples:

```text
I procrastinate constantly.

My manager takes credit for my work.

I am angry all the time.

I have a dishonest friend.

I fear taking risks.
```

Expected output:

```json
{
  "themes": [
    "laziness",
    "discipline"
  ],

  "virtues": [
    "self_effort"
  ],

  "sutras": [
    "CN_3_14",
    "CN_5_2"
  ]
}
```

This becomes your regression suite.

---

# What I Would Build Next

Given your Rails expertise, the highest-value deliverable is:

```text
1. Chanakya ontology
2. PostgreSQL schema
3. Sutra importer
4. Theme tagging system
5. Evaluation dataset
```

Only after those exist would I build:

```text
Retriever
Agent
Memory
UI
Subscriptions
```

Because the real moat of Neeti is not Ollama, LangGraph, Qdrant, or Neo4j.

The moat is a **well-structured Chanakya knowledge model** that transforms 455 sutras into an explainable advisory system.

This is a good generic AI-agent guide, but if the goal is **building Neeti as a production SaaS in Rails**, I would reject about 50% of it.

The guide assumes:

```text
Typical AI App
→ LangChain
→ LangGraph
→ ChromaDB
→ Python
→ Vector-first RAG
```

You are not building a generic chatbot.

You are building a **domain-specific reasoning system around 455 sutras**.

That changes everything.

---

# The Biggest Mistake

The guide starts with:

```text
LLM
↓
Vector Database
↓
RAG
```

For Neeti, the correct order is:

```text
Knowledge Model
↓
Retrieval
↓
Reasoning
↓
LLM
```

The moat is not the model.

The moat is the structured representation of Chanakya's wisdom.

---

# What I Would Build

## Layer 1 — Knowledge Layer

This is the most important part.

```ruby
Sutra
Theme
Virtue
Vice
Situation
Emotion
Role
Outcome
Action
```

Example:

```text
Sutra:
Greed destroys judgment.

Vice:
Greed

Opposing Virtue:
Contentment

Situations:
Money
Leadership
Business

Outcome:
Downfall
```

Now the system understands meaning.

---

## Layer 2 — Theme Graph

Not Neo4j.

Just PostgreSQL.

```ruby
ThemeRelationship

greed
  -> attachment

attachment
  -> suffering

discipline
  -> success

anger
  -> destruction
```

Postgres recursive CTEs can traverse this graph.

For 455 sutras:

```text
Neo4j = operational overhead
```

without meaningful gain.

---

## Layer 3 — Retrieval

My preferred retrieval order:

### Metadata

```sql
theme = greed
```

### Full Text Search

```sql
greed OR desire
```

### Theme Expansion

```text
greed
→ attachment
→ desire
→ suffering
```

### Embeddings

Only if needed.

---

# Memory Should Not Be a Vector Store

The guide recommends:

```text
Store conversations in vector DB
```

I would not.

For Neeti:

```ruby
UserInsight
```

Example:

```ruby
{
  user_id: 1,
  type: "career",
  theme: "leadership",
  content: "Struggles with delegation",
  confidence: 0.92
}
```

Stored relationally.

---

## Why?

Because later:

```sql
SELECT *
FROM user_insights
WHERE theme = 'leadership'
```

is far better than semantic search.

---

# Persona Design

This section of the guide is correct.

But I would make the persona stricter.

Many Chanakya bots fail because they become:

```text
ChatGPT wearing a turban
```

instead of Chanakya.

---

## System Rules

Neeti should:

### Always

```text
Identify vice or virtue
```

### Always

```text
Cite source sutras
```

### Always

```text
Give action plan
```

### Always

```text
Ask reflection question
```

---

Response structure:

```text
Diagnosis

Relevant Sutra(s)

Interpretation

Action Plan

Reflection
```

---

# LangGraph

I would not use it.

You already build:

* Rails services
* event-driven systems
* orchestrators
* background jobs

A Rails-native agent is straightforward.

Example:

```ruby
AdvisorAgent.call(query)
```

Internally:

```ruby
Analyze
Retrieve
Expand
Generate
Validate
Store Memory
```

No Python service required.

---

# ChromaDB / FAISS

For a prototype:

Sure.

For production:

No.

You already have:

```text
PostgreSQL
```

Use:

```sql
tsvector
GIN
pgvector (optional)
```

One database.

One backup strategy.

One deployment.

---

# What Neeti Actually Needs

Not:

```text
Chatbot
```

But:

```text
Advisor Engine
```

The flow should be:

```text
User Problem
↓
Theme Detection
↓
Virtue/Vice Analysis
↓
Retrieve Sutras
↓
Graph Expansion
↓
Advice Generation
↓
Memory Update
```

---

# The Feature That Will Differentiate Neeti

Most AI apps answer questions.

Neeti should diagnose patterns.

Example:

User says:

```text
I keep delaying important work.
```

Neeti should internally produce:

```json
{
  "vice": "laziness",
  "related_vices": [
    "fear",
    "comfort-seeking"
  ],
  "required_virtue": "discipline",
  "relevant_sutras": [
    "CN_3_14",
    "CN_5_2"
  ]
}
```

Then generate advice.

That becomes explainable.

---

# Final Architecture

If I were starting today with your Rails expertise:

```text
Rails 8

PostgreSQL
├── Sutras
├── Themes
├── Virtues
├── Vices
├── Situations
├── Emotions
├── UserInsights
└── ThemeRelationships

Structured Retrieval
├── Metadata
├── FTS
├── Graph Expansion
└── Optional Embeddings

Agent Runtime
├── Analyzer
├── Retriever
├── Generator
├── Validator
└── Memory

Ollama
OpenAI fallback

React Frontend
SSE Streaming
```

No

This plan is well-written, but it is optimized for a **Python AI startup stack**, not for **you**.

Given your background:

```text
Rails 8
PostgreSQL
Docker
Kubernetes
Event-driven systems
Ollama integration
Custom agent runtimes
```

I would reject about 60% of this architecture.

---

# Biggest Problem

The plan assumes:

```text
Python
LangGraph
LangChain
Qdrant
Neo4j
LangSmith
```

which means:

```text
Application DB     -> PostgreSQL
Vector DB          -> Qdrant
Graph DB           -> Neo4j
Agent Runtime      -> LangGraph
Observability      -> LangSmith
```

Now you are operating:

```text
5 systems
5 deployments
5 backups
5 failure modes
```

for a corpus containing:

```text
455 sutras
17 chapters
```

That is architectural overkill.

---

# What I Would Build

## Layer 1 — Knowledge

PostgreSQL only.

```ruby
sutras
chapters

themes
virtues
vices
situations
emotions
actors

theme_relationships

conversations
messages
insights
```

No Neo4j.

No graph database.

---

## Layer 2 — Retrieval

### First Retrieval

```ruby
MetadataRetriever
```

Example:

```text
lazy
```

maps to

```text
vice=laziness
```

---

### Second Retrieval

```ruby
FullTextRetriever
```

Using:

```sql
tsvector
GIN
```

---

### Third Retrieval

```ruby
ThemeExpansionRetriever
```

Using:

```ruby
theme_relationships
```

Example:

```text
greed
 ↓
attachment
 ↓
suffering
 ↓
downfall
```

---

### Fourth Retrieval

Optional.

```ruby
EmbeddingRetriever
```

using:

```text
pgvector
```

inside PostgreSQL.

Not Qdrant.

---

# Knowledge Graph

I would absolutely build one.

But inside PostgreSQL.

Example:

```ruby
ThemeRelationship

source_theme
target_theme
relationship_type
weight
```

Examples:

```text
Greed
  causes
Suffering

Discipline
  leads_to
Success

Fear
  blocks
Action
```

Then:

```sql
WITH RECURSIVE
```

handles traversal.

---

# Memory

The plan proposes:

```text
Vector memory
```

I disagree.

For Neeti:

Use structured memory.

```ruby
UserInsight

category
content
confidence
```

Example:

```text
Career

User avoids delegation
```

```text
Leadership

User struggles with confrontation
```

This is explainable.

---

# LangGraph

You do not need it.

Build your own.

You have already built more complex trading systems than LangGraph workflows.

Example:

```ruby
class AdvisorAgent
  def call(query)
    analysis = Analyzer.call(query)

    sutras = Retriever.call(analysis)

    draft = Generator.call(
      query: query,
      sutras: sutras
    )

    Validation.call(draft)
  end
end
```

Simple.

Testable.

Ruby-native.

---

# Evaluation

This is the part I strongly agree with.

Build this before launch.

Create:

```ruby
evaluation_cases
evaluation_runs
```

Examples:

```text
User:
I procrastinate.

Expected:
laziness
discipline
self-effort
```

```text
User:
My friend betrayed me.

Expected:
friendship
trust
testing
```

This becomes your benchmark.

---

# Actual Roadmap I Would Use

## Week 1

```text
PostgreSQL schema
Ontology
Importer
```

Output:

```text
455 structured sutras
```

---

## Week 2

```text
Metadata retrieval
FTS retrieval
Theme graph retrieval
```

Output:

```text
Correct sutras returned
```

---

## Week 3

```text
Ollama integration
Tool calling
Agent runtime
```

Output:

```text
First working advisor
```

---

## Week 4

```text
Memory
Evaluation suite
Reflection
```

Output:

```text
Reliable advisor
```

---

## Week 5

```text
React UI
Streaming
Authentication
Payments
```

Output:

```text
MVP
```

---

# Final Architecture

If I were the architect for Neeti today:

```text
Frontend
---------
React
TypeScript
Vite

Backend
--------
Rails 8 API

Data
----
PostgreSQL

AI
--
Ollama
OpenAI fallback

Retrieval
---------
Metadata
FTS
Graph
pgvector (optional)

Jobs
----
Solid Queue

Cache
-----
Solid Cache

Realtime
--------
Solid Cable
```

I would explicitly avoid:

```text
LangChain
LangGraph
Qdrant
Pinecone
Weaviate
Neo4j
LangSmith
Redis
```

until you have proven that:

1. Retrieval quality is insufficient.
2. User count justifies additional infrastructure.
3. A measurable bottleneck exists.

For a 455-sutra Chanakya advisor, the real competitive advantage is **ontology quality + retrieval quality + persona quality**, not the choice of vector database or orchestration framework.

This hybrid strategy is much better than the earlier all-LangGraph plan because it recognizes a key reality:

```text
Development != Production
```

Using local models during development is exactly the right move.

However, I would still redesign the architecture substantially.

---

# What I Agree With

## Local Ollama Development

Absolutely.

For Neeti:

```text
Development
-----------
qwen3:8b
qwen3:30b-a3b
llama3.3

Production
-----------
GPT-4o-mini
Claude
OpenAI-compatible endpoint
```

This aligns with your existing experience using Ollama and your `ollama-client` work.

---

## Model Router

Correct concept.

But since you are a Ruby developer, I would implement:

```ruby
LLMRouter
```

not:

```python
ModelRouter
```

Example:

```ruby
class LLMRouter
  PROVIDERS = {
    development: :ollama,
    production: :openai
  }.freeze

  def chat(messages)
    provider.chat(messages)
  end
end
```

---

## Evaluation Suite

This is probably the most valuable recommendation.

Most RAG projects never measure quality.

You should.

---

# What I Still Disagree With

## LangGraph

The entire architecture still assumes:

```text
LangGraph
↓
Nodes
↓
StateGraph
↓
Deploy CLI
```

You don't need any of it.

You already build systems like:

```text
Signal
↓
Analyzer
↓
Risk Manager
↓
Execution
↓
Position Manager
```

for trading.

That is more complex than most LangGraph workflows.

Neeti can be:

```ruby
QueryAnalyzer
↓
Retriever
↓
ThemeExpander
↓
Generator
↓
Validator
↓
MemoryUpdater
```

Rails services.

---

## Qdrant

Still unnecessary.

For 455 sutras:

```text
Qdrant
+
Postgres
```

creates more problems than it solves.

Use:

```text
Postgres
```

first.

Add:

```text
pgvector
```

only if needed.

---

## Neo4j

Same issue.

For:

```text
455 sutras
```

I would use:

```ruby
theme_relationships
```

table.

Example:

```ruby
Greed
  causes
Suffering

Discipline
  leads_to
Success
```

and query via:

```sql
WITH RECURSIVE
```

inside PostgreSQL.

---

# The Architecture I Would Actually Ship

## Data Layer

```text
PostgreSQL
```

Tables:

```text
chapters

sutras

themes
virtues
vices
situations
emotions

theme_relationships

conversations
messages

user_insights
```

---

## Retrieval Layer

### 1. Metadata

```text
lazy
↓
vice=laziness
```

---

### 2. FTS

```sql
tsvector
GIN
```

---

### 3. Graph Expansion

```text
laziness
↓
discipline
↓
self-effort
```

---

### 4. Optional Embeddings

```text
pgvector
```

inside Postgres.

No separate vector database.

---

## Agent Layer

```text
Analyzer
↓
Retriever
↓
Generator
↓
Validator
↓
Memory
```

---

## LLM Layer

```text
Development
-----------
Ollama

Production
-----------
GPT-4o-mini

Fallback
-----------
Claude
```

---

# The Most Important Missing Component

The plan focuses heavily on infrastructure.

The real risk is not infrastructure.

The real risk is:

```text
Does Neeti retrieve the correct sutras?
```

Therefore I would add:

## Phase 0.5

Before any LangGraph, Ollama, Neo4j, or Qdrant work:

Build:

```text
Chanakya Ontology
```

Example:

```json
{
  "theme": "laziness",
  "related_themes": [
    "discipline",
    "effort",
    "learning"
  ],
  "opposing_theme": "self-effort"
}
```

And:

```json
{
  "theme": "greed",
  "related_themes": [
    "desire",
    "attachment"
  ],
  "opposing_theme": "contentment"
}
```

This ontology will become the foundation of retrieval.

---

# What I Would Build First

Not:

```text
LangGraph nodes
```

Not:

```text
Qdrant collections
```

Not:

```text
Neo4j schema
```

I would build:

### Week 1

```text
Sutra importer
Theme taxonomy
Ontology
```

### Week 2

```text
Metadata retrieval
FTS retrieval
Graph expansion
```

### Week 3

```text
Agent runtime
Ollama integration
```

### Week 4

```text
Evaluation benchmark
```

### Week 5

```text
React UI
Payments
Daily Sutra
```

---

If Neeti were my project and I had your Rails/Ollama background, the final stack would be:

```text
Rails 8
PostgreSQL

Structured RAG
FTS
Theme Graph
pgvector (optional)

Ollama
OpenAI
Claude

Solid Queue
Solid Cache
Solid Cable

React
TypeScript
```

and I would intentionally avoid introducing:

```text
LangGraph
LangChain
Qdrant
Neo4j
LangSmith
```

until there is measurable evidence that PostgreSQL-based retrieval is insufficient. The corpus is simply too small to justify the operational complexity.

This is the closest proposal so far to something I would actually build, because it finally aligns with your stack:

```text
Ruby
Rails
PostgreSQL
Ollama
Custom Agents
```

However, there are still several architectural issues I would fix before writing code.

# What I Would Keep

## 1. ollama-client as the Core Abstraction

This is exactly right.

You already maintain and understand the gem.

Your architecture should be built around:

```ruby
Ollama::Client
```

not around:

```text
LangChain
LangGraph
LlamaIndex
```

---

## 2. Model Router

Keep it.

But expand it.

```ruby
class LLMRouter
  def chat(...)
  end

  def generate(...)
  end

  def embed(...)
  end

  def structured(...)
  end

  def tool_call(...)
  end
end
```

Every provider should expose the same interface.

```text
Ollama
OpenAI
Anthropic
Gemini
DeepSeek
```

behind one contract.

---

## 3. Tool Calling

Absolutely.

Neeti should be tool-driven.

```text
User
 ↓
Analyzer
 ↓
Tool Calls
 ↓
Observations
 ↓
Answer
```

instead of:

```text
Prompt
 ↓
Magic
 ↓
Answer
```

---

# What I Would Change

## 1. Remove Neo4j

I still don't see a reason for it.

Current proposal:

```text
Postgres
Qdrant
Neo4j
Redis
```

For:

```text
455 sutras
```

No.

I would replace Neo4j with:

```ruby
theme_relationships
```

Example:

```ruby
create_table :theme_relationships do |t|
  t.references :source_theme
  t.references :target_theme

  t.string :relationship_type

  t.decimal :weight
end
```

Examples:

```text
Greed -> causes -> Suffering

Discipline -> leads_to -> Success

Fear -> blocks -> Action
```

---

## 2. Replace Redis Memory

Since you're already using Rails 8.

Use:

```text
Solid Cache
Solid Queue
PostgreSQL
```

Instead of:

```text
Redis
```

Conversation memory:

```ruby
Conversation
Message
Insight
```

tables.

No additional infrastructure.

---

## 3. Qdrant Is Premature

This is where I disagree most.

You don't know yet whether embeddings are necessary.

Build:

```text
Metadata Retrieval
+
FTS
+
Theme Graph
```

first.

Then measure.

If retrieval quality is poor:

```text
pgvector
```

Then:

```text
Qdrant
```

only if pgvector becomes insufficient.

---

# Missing Component: Ontology Builder

This is the real moat.

Before embeddings.

Before vectors.

Before agents.

Build:

```ruby
Theme
Virtue
Vice
Situation
Emotion
Role
Action
Outcome
```

---

Example:

```json
{
  "theme": "laziness",

  "related_themes": [
    "discipline",
    "effort"
  ],

  "opposite_theme": "self_effort",

  "situations": [
    "career",
    "education"
  ]
}
```

Without this layer, Neeti becomes:

```text
Vector Search
+
LLM
```

which is easy to copy.

---

# Missing Component: Retrieval Pipeline

The proposed agent jumps directly into embeddings.

I would do:

## Layer 1

Metadata

```ruby
theme=laziness
```

---

## Layer 2

FTS

```sql
lazy
discipline
effort
```

---

## Layer 3

Theme Expansion

```text
laziness
 ↓
discipline
 ↓
self-effort
```

---

## Layer 4

Embeddings

Only if required.

---

# Agent Architecture I'd Build

Not:

```ruby
retrieve_sutras
find_related_themes
```

Only.

I would create:

```ruby
AnalyzeProblemTool

RetrieveSutrasTool

ExpandThemesTool

SearchMemoryTool

GenerateReflectionTool
```

---

Flow:

```text
User
 ↓
Analyze Problem
 ↓
Identify Virtue/Vice
 ↓
Retrieve Sutras
 ↓
Expand Themes
 ↓
Search Memory
 ↓
Generate Advice
 ↓
Generate Reflection
```

---

# Memory Architecture

Instead of:

```ruby
store_insight(
  user_id,
  insight,
  themes
)
```

I would normalize.

```ruby
UserInsight
```

```ruby
user_id
category
theme_id
content
confidence
```

Examples:

```text
Leadership

Struggles with delegation
```

```text
Career

Avoids confrontation
```

```text
Relationships

Trust issues
```

This becomes queryable.

---

# Evaluation Framework

This proposal finally touches evaluation, but not enough.

Create:

```ruby
EvaluationCase
EvaluationRun
```

---

Example:

```ruby
{
  query: "I procrastinate constantly",

  expected_themes: [
    "laziness",
    "discipline"
  ],

  expected_sutras: [
    "CN_3_14"
  ]
}
```

Nightly run:

```text
Retrieval Accuracy
Theme Accuracy
Answer Quality
```

---

# What I Would Build Next

If I were implementing Neeti tomorrow, I would not start with Neo4j or Qdrant.

I would build:

### Step 1

```text
Ontology
```

### Step 2

```text
PostgreSQL Schema
```

### Step 3

```text
Sutra Importer
```

### Step 4

```text
Metadata Retrieval
FTS Retrieval
Theme Graph Retrieval
```

### Step 5

```text
LLM Router
```

using your `ollama-client`.

### Step 6

```text
Advisor Agent
```

### Step 7

```text
Evaluation Suite
```

### Step 8

```text
React UI
```

---

If your goal is a production-grade Neeti system, the architecture I would sign off on today is:

```text
Rails 8
PostgreSQL

Sutra Ontology
Theme Graph

Metadata Retrieval
FTS Retrieval
pgvector (optional)

Ollama Client
OpenAI Fallback
Anthropic Fallback

Advisor Agent
Memory Store
Evaluation Framework

React + SSE
```

Everything else—Neo4j, Qdrant, Redis, LangGraph, LangSmith—should be treated as optimization layers that are added only after a measurable need appears. For a 455-sutra corpus, they are not part of the minimum architecture that delivers high-quality advice.

Of all the names proposed so far, I would rank them differently if the goal is building a serious SaaS around Chanakya Neeti.

# My Ranking

## 🥇 Neeti

Best choice.

Advantages:

```text
Short
Easy to pronounce globally
Directly tied to Chanakya Neeti
Not tied to a single historical figure
Works for app, company, domain, gem
```

Future expansion:

```text
Neeti
├── Career Neeti
├── Founder Neeti
├── Relationship Neeti
├── Daily Neeti
└── Financial Neeti
```

This scales naturally.

---

## 🥈 Artha

Very strong.

Advantages:

```text
Ancient Sanskrit
Recognized globally
Related to purpose, wealth, meaning
Premium sounding
```

Problem:

Most people don't immediately associate it with Chanakya.

---

## 🥉 Dhi

Beautiful name.

Advantages:

```text
3 letters
Unique
Memorable
Wisdom/intellect
```

Problem:

Requires education.

People won't know what it means.

---

# Names I Would Avoid

## Kautilya

Technically accurate.

Practically problematic.

Issues:

```text
Hard spelling
Hard pronunciation
Long
Feels academic
```

Example:

```text
What app do you use?

Kautilya.

Can you spell that?
```

You lose brand recall.

---

## Vishnugupta

Even worse.

Great historical reference.

Poor product name.

---

## Takshashila

Good institute name.

Bad product name.

Too long.

---

## Maurya

Strong.

But:

```text
Empire
Dynasty
History
```

not

```text
Personal advisor
```

---

## MyChanakya

Feels like:

```text
2015 startup naming
```

Not premium.

---

## AskChanakya

Useful as a feature.

Not as a company.

Example:

```text
Neeti
└── Ask Chanakya
```

---

# What I Would Actually Register

Priority:

### 1

```text
Neeti
```

Brand.

---

### 2

```text
Daily Neeti
```

Feature.

---

### 3

```text
Founder Neeti
```

Premium module.

---

### 4

```text
Career Neeti
```

Premium module.

---

# Product Vision Test

Ask:

> Can this name still work in 10 years?

### Neeti

```text
AI Advisor
✓

Habit App
✓

Coaching Platform
✓

Courses
✓

Community
✓

Enterprise Product
✓
```

---

### Chanakya

```text
AI Advisor
✓

Coaching Platform
✓

Enterprise Product
✗

Global Brand
✗
```

Too tightly coupled.

---

# Gem Naming

Since you're likely to build reusable gems:

I would reserve:

```text
neeti
neeti-core
neeti-agent
neeti-rag
neeti-memory
```

instead of:

```text
chanakya-agent
kautilya-core
```

because those become limiting.

---

# Logo Direction

For Neeti, I would use:

```text
Primary:
NEETI

Secondary:
नीति
```

Minimal.

No crown.

No king.

No Chanakya illustration.

No ancient scroll.

Most products in this category become cliché because they lean too heavily on historical imagery.

A modern logo with subtle Sanskrit roots will age much better.

# Final Recommendation

If your goal is a real product and not just a Chanakya chatbot:

```text
Product Name: Neeti

Company Name: Neeti Labs

App Name: Neeti

Advisor Persona:
"Chanakya"
```

That separation is important.

Users install:

```text
Neeti
```

and inside the product they interact with:

```text
Chanakya
```

This gives you freedom to later add other advisors, philosophies, and knowledge systems without rebranding the entire platform.

The branding direction is good, but I would make decisions based on **company-building**, not just domain availability.

## Decision

**Use: Neeti**

```text
Product: Neeti
Company: Neeti Labs
Primary Advisor Persona: Chanakya
```

Avoid:

```text
Product: Chanakya
Company: Chanakya AI
```

because it locks you into one philosophy forever.

---

# Domain Strategy

I would not optimize for the perfect domain initially.

Most founders waste months on this.

Priority order:

### Tier 1

* neeti.app
* neeti.one

### Tier 2

* tryneeti.com
* getneeti.com
* useneeti.com

### Tier 3

* neeti.ai (acquisition later)

---

# My Recommendation

Register immediately:

```text
neeti.app
neeti.one
```

Both.

The combined annual cost is negligible compared to the value of securing the brand.

Then:

```text
neeti.app
→ production application

neeti.one
→ marketing / waitlist / redirects
```

---

# Product Architecture Naming

I would standardize everything under the Neeti namespace.

```text
Neeti
├── Neeti Core
├── Neeti Agent
├── Neeti Memory
├── Neeti Knowledge
├── Neeti Daily
└── Neeti Insights
```

Ruby gems:

```ruby
neeti-core
neeti-agent
neeti-memory
neeti-rag
neeti-ui
```

This becomes very clean.

---

# Logo Direction

I disagree with one part of the proposal.

## Avoid Traditional Spiritual Visuals

Do not use:

```text
Lotus
Temple
Sage
Scroll
Crown
Mauryan Lion
```

Most Indian philosophy startups do this.

They immediately look:

```text
religious
spiritual
educational
```

instead of:

```text
modern
premium
intelligent
```

---

## Recommended Logo

### Primary

```text
NEETI
```

Clean geometric sans-serif.

Examples:

* Inter
* Geist
* Satoshi
* General Sans

---

### Secondary Mark

```text
नी
```

not

```text
नीति
```

Reason:

```text
Favicon
Mobile app icon
Avatar
Social profile
```

needs a compact symbol.

"नी" works far better than the full word.

---

## Color Palette

I would avoid saffron as the primary brand color.

Saffron immediately creates:

```text
political
religious
cultural assumptions
```

Use it only as an accent.

Recommended:

```text
Primary:
Deep Indigo

Secondary:
Off White

Accent:
Muted Saffron
```

This feels:

```text
wisdom
trust
strategy
```

without feeling religious.

---

# Brand Positioning

Do not market it as:

```text
AI based on Chanakya Neeti
```

Market it as:

```text
Strategic life intelligence.
```

Then explain:

```text
Powered by the wisdom of Chanakya Neeti.
```

This is a much larger market.

---

# Tagline Ideas

Best options:

```text
Ancient wisdom. Practical decisions.
```

```text
Think strategically. Live intentionally.
```

```text
Timeless principles for modern decisions.
```

```text
Wisdom for difficult decisions.
```

Avoid:

```text
Ask Chanakya
```

It sounds like a chatbot.

---

# Product Vision

What you're building is not:

```text
A Chanakya chatbot
```

It's:

```text
A decision intelligence platform
```

with Chanakya as the first advisor.

Future:

```text
Neeti
├── Chanakya
├── Stoic Advisor
├── Buddhist Advisor
├── Leadership Advisor
└── Founder Advisor
```

The Neeti brand can support all of those without rebranding.

That's why I would commit to **Neeti** as the permanent product and company name now.

I think you're underestimating the opportunity and overestimating the importance of subscriptions in the early stages.

# My Assessment

Can Neeti become revenue generating?

**Yes.**

Can it become a large business?

**Possibly.**

Will it happen because of AI + Chanakya alone?

**No.**

The real product is not:

```text
Chanakya AI
```

The real product is:

```text
Decision Intelligence
```

with Chanakya as the first reasoning framework.

---

# The Biggest Risk

Not technology.

Not LLM cost.

Not competition.

The biggest risk is:

```text
Low retention
```

Most users:

```text
Ask 3 questions
↓
Get answers
↓
Never return
```

This kills subscription businesses.

---

# What I Would Monetize

## Phase 1

Completely free.

Goal:

```text
100 users
```

not:

```text
Revenue
```

Metrics:

```text
Daily Active Users
Weekly Active Users
Retention
Questions per user
```

---

## Phase 2

Introduce:

### Neeti Plus

₹149/month

Features:

```text
Unlimited questions
Conversation history
Personal memory
Daily Sutra
```

Nothing more.

---

## Phase 3

Introduce:

### Neeti Strategist

₹499/month

Features:

```text
Life areas
Goal tracking
Weekly reviews
Deep analysis
```

This is where most revenue will come from.

---

# What I Would NOT Build

Initially:

```text
Human coaches
```

Reason:

You become a services company.

Not a software company.

Every user creates operational work.

---

# What I Would Build Instead

## Daily Neeti

Every morning:

```text
One relevant sutra
One reflection
One action
```

Example:

```text
Today's Principle

"Knowledge is the true wealth."

Reflection:
What are you avoiding learning?

Action:
Spend 20 minutes learning something useful.
```

This creates habit.

---

## Weekly Review

Sunday:

```text
What decisions did you make?

What patterns appeared?

What virtues improved?

What vices appeared?
```

This becomes sticky.

---

# Revenue Projection Reality

I would model:

### Year 1

```text
2,000 users

5% conversion

100 paid users

₹149/month
```

Revenue:

```text
₹14,900/month
```

This is realistic.

---

### Year 2

```text
10,000 users

10% conversion

1,000 paid users
```

Revenue:

```text
₹149,000/month
```

plus higher tiers.

---

# Technical Cost

Your proposed stack actually gives you a huge advantage.

If you use:

```text
Ollama
PostgreSQL
Rails
```

during development:

Infrastructure cost is almost irrelevant.

You can likely operate the MVP for:

```text
₹2,000–₹10,000/month
```

depending on hosting and traffic.

---

# The Product I Would Actually Launch

## MVP

Features:

```text
Ask Chanakya
Daily Sutra
Conversation History
Memory
```

Nothing else.

---

## V2

Add:

```text
Career Neeti
Founder Neeti
Relationship Neeti
```

Structured guidance.

---

## V3

Add:

```text
Weekly Review
Habit Tracking
Decision Journal
```

This is where retention increases dramatically.

---

# If I Were You

Given your background in:

```text
Rails
Architecture
AI Agents
Trading Systems
```

I would spend the next month building:

```text
1. Ontology
2. Sutra Database
3. Retrieval Engine
4. Advisor Agent
5. Daily Sutra System
```

I would **not** spend time on:

```text
Payments
Marketing funnels
Complex pricing
Human coaching
```

until I can answer one question:

> Do users come back every day?

If users return daily, Neeti has a business.

If users only ask questions occasionally, it becomes an interesting project but not a sustainable SaaS.

Of the four options, I would choose **#1 first: Convert the 17 chapters into a structured knowledge database**.

Not because it's the easiest.

Because it unlocks everything else.

---

# Recommended Execution Order

## Phase 1 — Knowledge Model (Do First)

Build:

```text
Chapter
 ↓
Sutra
 ↓
Theme
 ↓
Virtue
 ↓
Vice
 ↓
Situation
 ↓
Emotion
```

Example:

```json
{
  "canonical_id": "CN_03_14",
  "chapter": 3,
  "sanskrit": "...",
  "translation": "...",

  "themes": [
    "self_effort",
    "discipline"
  ],

  "virtues": [
    "discipline"
  ],

  "vices": [
    "laziness"
  ],

  "situations": [
    "career",
    "education"
  ],

  "emotions": [
    "fear"
  ]
}
```

This becomes:

```text
Retrieval
Memory
Advice
Analytics
Evaluation
```

all from the same source.

---

## Phase 2 — Ontology

Build explicit relationships.

Example:

```json
{
  "greed": {
    "opposes": ["contentment"],
    "causes": ["suffering"],
    "related": ["attachment"]
  },

  "discipline": {
    "leads_to": ["success"],
    "opposes": ["laziness"]
  }
}
```

Store in PostgreSQL.

```ruby
ThemeRelationship
```

table.

---

## Phase 3 — Evaluation Dataset

Before AI.

Create:

```text
100 user scenarios
```

Example:

```text
I procrastinate.

Expected:
- laziness
- discipline
- self_effort
```

```text
My friend betrayed me.

Expected:
- trust
- friendship
- testing
```

This becomes your regression suite.

---

## Phase 4 — Persona Prompt

Only after the ontology exists.

A good prompt is easy.

A good knowledge model is hard.

---

# The Real Deliverable

If I were building Neeti, the first milestone would be:

```text
Ask a question
↓
Get correct themes
↓
Get correct sutras
```

Not:

```text
Ask a question
↓
LLM writes something impressive
```

Those are very different products.

---

# Suggested Database Structure

Given your Rails background:

```ruby
chapters

sutras

themes
virtues
vices
situations
emotions

sutra_themes
sutra_virtues
sutra_vices
sutra_situations
sutra_emotions

theme_relationships
```

No arrays.

Pure relational design.

---

# What I Would Do This Week

### Day 1

Create:

```text
Ontology
```

Master lists:

```text
Virtues
Vices
Situations
Emotions
Actors
```

---

### Day 2

Import all 455 sutras.

---

### Day 3

Tag each sutra.

Manual + AI-assisted.

---

### Day 4

Build retrieval.

```text
Theme
FTS
Graph
```

---

### Day 5

Create benchmark scenarios.

---

### Day 6

Integrate `ollama-client`.

---

### Day 7

First working advisor.

---

So if you're asking what should be operationalized next, my answer is:

```text
1. Convert all 17 chapters into structured JSON
2. Create the ontology
3. Create theme relationships
4. Build the evaluation dataset
5. Then build the agent
```

Everything else—persona prompts, embeddings, landing pages, subscriptions, marketing—is downstream of having a high-quality Chanakya knowledge base. That knowledge base will become the real moat of Neeti.

# Direct decision

Use **2-week Scrum sprints** with a **Kanban ops lane** for bugs, fixes, and launch issues.
Build **Neeti** on the stack we aligned on:

* **Rails 8 API**
* **PostgreSQL**
* **Solid Queue / Cache / Cable**
* **React + TypeScript**
* **Ollama locally, cloud fallback in production**
* **Structured RAG, not vector-first**
* **No LangChain / Qdrant / Neo4j in v1**

---

# Delivery methodology

## Operating model

* **Product discovery** in parallel with delivery
* **Sprint planning** every 2 weeks
* **Daily standup** 15 minutes
* **Backlog refinement** once per week
* **Sprint review + demo** at the end of every sprint
* **Retro** after every sprint
* **Release gate** only after quality checks pass

## Work policy

* Each story must have:

  * clear acceptance criteria
  * test coverage
  * logging/observability impact
  * rollback plan if it touches production paths

## Definition of done

A story is done only when:

* code is merged
* tests pass
* feature is demoable
* observability exists
* security/privacy review is passed where applicable

---

# Product delivery structure

## Epic map

| Epic                        | Outcome                                      |
| --------------------------- | -------------------------------------------- |
| E1. Product foundation      | Repo, architecture, standards, environments  |
| E2. Chanakya knowledge base | Structured sutras, ontology, tagging         |
| E3. Retrieval engine        | Metadata, FTS, graph expansion, ranking      |
| E4. Agent runtime           | Prompting, tool use, safety, citations       |
| E5. Memory system           | Short-term and long-term user memory         |
| E6. Evaluation system       | Golden dataset, benchmark, regression checks |
| E7. UI and experience       | Chat, streaming, daily sutra, history        |
| E8. Auth and billing        | Login, plans, usage limits, payments         |
| E9. Production hardening    | Security, monitoring, deployment, backups    |
| E10. Launch and growth      | Beta, analytics, retention, onboarding       |

---

# Sprint roadmap from scratch to production

## Sprint 0 — Foundation and project setup

**Goal:** create a production-grade base.

### Stories

* As a developer, I can clone and run the app locally.
* As a developer, I can start API, DB, background jobs, and frontend consistently.
* As a team, we have coding standards, branching rules, and environment separation.

### Tasks

* Initialize Rails 8 API project
* Set up PostgreSQL
* Add Solid Queue, Cache, Cable
* Set up React + TypeScript app
* Configure linting, formatting, test tooling
* Create environment files for dev/stage/prod
* Add Docker Compose
* Set up CI pipeline
* Define folder structure and naming conventions
* Create basic health check endpoints

### Deliverables

* One-command local startup
* CI running on every PR
* Baseline deployment ready

---

## Sprint 1 — Knowledge model and sutra ingestion

**Goal:** transform Chanakya Neeti into structured data.

### Stories

* As a system, I can store sutras with chapter and canonical IDs.
* As a system, I can tag sutras with themes, virtues, vices, situations, and emotions.
* As a system, I can import sutras from a source file.

### Tasks

* Design database schema
* Create `sutras`, `chapters`, `themes`, `virtues`, `vices`, `situations`, `emotions`
* Create join tables
* Create `theme_relationships`
* Build importer for CSV/JSON source
* Normalize sutra IDs
* Seed initial ontology
* Add admin verification scripts
* Write import tests

### Deliverables

* All sutras stored structurally
* Ontology tables populated
* Searchable schema ready

---

## Sprint 2 — Ontology and tagging engine

**Goal:** build the semantic backbone.

### Stories

* As a system, I can infer theme tags from sutra content.
* As a system, I can map opposing and related concepts.
* As an admin, I can review and correct tags.

### Tasks

* Build ontology definition file
* Create rule-based tagger for themes/virtues/vices
* Add optional LLM-assisted tag suggestion workflow
* Build manual review endpoints or console task
* Create quality checks for tag consistency
* Add seed data for relationship graph
* Add validation for duplicate or conflicting tags

### Deliverables

* Stable ontology
* Reviewable tagging pipeline
* Clear relationships between concepts

---

## Sprint 3 — Retrieval engine v1

**Goal:** retrieve the right sutras without embeddings first.

### Stories

* As a user, I can ask a question and get relevant sutras.
* As a system, I can search by metadata and full text.
* As a system, I can expand results through theme relationships.

### Tasks

* Build metadata retriever
* Build Postgres full-text search
* Build theme graph expansion using recursive CTEs
* Build result scoring and deduplication
* Add query normalization
* Add fallback logic for no-match queries
* Add retrieval logging
* Write integration tests with known queries

### Deliverables

* Working structured retrieval
* Ranked sutra results
* Explainable search path

---

## Sprint 4 — Agent runtime and LLM router

**Goal:** turn retrieval into answer generation.

### Stories

* As a user, I receive grounded advice from retrieved sutras.
* As a system, I can switch between local Ollama and cloud models.
* As a system, I enforce the Chanakya persona and response format.

### Tasks

* Implement `LLMRouter`
* Add Ollama development path
* Add cloud fallback path
* Build agent service with:

  * problem analysis
  * retrieval call
  * synthesis
  * validation
* Add tool calling abstraction
* Add response schema
* Add prompt guardrails
* Add source citation format
* Add refusal rules for unsupported queries

### Deliverables

* First working advisor
* Controlled output format
* Local + cloud model switch

---

## Sprint 5 — Memory and personalization

**Goal:** make the advisor remember the user.

### Stories

* As a user, the advisor remembers my past struggles.
* As a system, I can store short-term session context.
* As a system, I can store long-term user insights.

### Tasks

* Design memory schema
* Implement conversation persistence
* Implement insight extraction job
* Add user profile signals
* Add memory retrieval based on current query
* Add memory summarization
* Add privacy controls and retention policy
* Add tests for memory recall and isolation

### Deliverables

* Personalized responses
* Session continuity
* Long-term insight storage

---

## Sprint 6 — Evaluation and quality gate

**Goal:** stop regressions before launch.

### Stories

* As a team, we can measure retrieval quality.
* As a team, we can measure answer faithfulness.
* As a team, we can detect regressions on core scenarios.

### Tasks

* Build benchmark dataset of 50–100 test queries
* Define expected sutras/themes for each query
* Create evaluation runner
* Add scoring metrics:

  * retrieval precision
  * retrieval recall
  * response faithfulness
  * source coverage
  * style adherence
* Add regression test job in CI
* Add manual review workflow for low scores

### Deliverables

* Benchmark suite
* Automated quality checks
* Go/no-go metrics

---

## Sprint 7 — UI/UX and streaming experience

**Goal:** make the product usable and engaging.

### Stories

* As a user, I can chat with streaming responses.
* As a user, I can see sources and reasoning.
* As a user, I can view history and saved insights.

### Tasks

* Build React chat UI
* Add streaming via SSE
* Render citations/sutra cards
* Add conversation history
* Add insight timeline
* Add loading/error states
* Add mobile responsive layout
* Add empty state and onboarding screens

### Deliverables

* Polished chat experience
* Source-backed answers visible to users
* Usable mobile UI

---

## Sprint 8 — Authentication, limits, and billing

**Goal:** convert usage into revenue.

### Stories

* As a user, I can sign up and sign in.
* As a user, I can subscribe to a plan.
* As a system, I can enforce usage limits.

### Tasks

* Add auth flows
* Add account settings
* Add subscription plans
* Integrate Razorpay
* Add webhook handlers
* Add plan enforcement middleware
* Add usage counters and quotas
* Add upgrade/downgrade flows
* Add invoice/receipt handling

### Deliverables

* Monetization live
* Plan-based access control
* Billing events tracked

---

## Sprint 9 — Production hardening

**Goal:** make it safe to launch.

### Stories

* As an operator, I can monitor system health.
* As an operator, I can recover from failures.
* As a user, my data is protected.

### Tasks

* Add structured logging
* Add error monitoring
* Add performance metrics
* Add request tracing
* Add job retry policies
* Add backup and restore procedures
* Add rate limiting
* Add secrets management
* Add audit logs
* Add security review checklist
* Add disaster recovery runbook

### Deliverables

* Production observability
* Backup/recovery readiness
* Security baseline

---

## Sprint 10 — Beta launch and retention loops

**Goal:** get real users and learn fast.

### Stories

* As a user, I receive a daily sutra.
* As a user, I can return and continue my thread.
* As the team, we can measure retention and activation.

### Tasks

* Add daily sutra scheduler
* Add onboarding quiz or first-use path
* Add email/push/Telegram notifications
* Add retention analytics
* Add event tracking
* Add cohort analysis dashboard
* Add feedback capture
* Add beta user support workflow
* Add feature flags for experiments

### Deliverables

* Beta released
* Retention loops active
* Feedback pipeline working

---

# Epic detail view

## E1. Product foundation

### Stories

* Repo setup
* Local environment
* CI/CD baseline
* Code quality standards

### Acceptance criteria

* app boots locally in one command
* PR checks block broken code
* environment parity across dev/stage

---

## E2. Chanakya knowledge base

### Stories

* Sutra import
* chapter organization
* theme/virtue/vice tagging
* ontology management

### Acceptance criteria

* every sutra has canonical ID
* every sutra has at least one theme
* relationships are queryable

---

## E3. Retrieval engine

### Stories

* metadata matching
* FTS matching
* graph expansion
* ranking/dedup

### Acceptance criteria

* query returns relevant sutras in <150ms locally
* exact phrase search works
* graph relations improve result quality

---

## E4. Agent runtime

### Stories

* model router
* prompt assembly
* tool calling
* output validation

### Acceptance criteria

* answers cite sutras
* invalid outputs are rejected
* model switching is transparent

---

## E5. Memory system

### Stories

* session memory
* long-term memory
* insight extraction
* memory retrieval

### Acceptance criteria

* user context persists
* memory is isolated per user
* sensitive data retention is controlled

---

## E6. Evaluation system

### Stories

* benchmark set
* automated scoring
* regression alerts

### Acceptance criteria

* every major change can be benchmarked
* low-quality outputs are caught before release

---

## E7. UI and experience

### Stories

* chat screen
* streaming
* sources panel
* history
* daily sutra

### Acceptance criteria

* mobile-first layout works
* response feels realtime
* source references are visible

---

## E8. Auth and billing

### Stories

* signup/login
* plan selection
* Razorpay payment
* quota enforcement

### Acceptance criteria

* subscriptions work end-to-end
* free and paid paths are isolated
* failed payments handled cleanly

---

## E9. Production hardening

### Stories

* monitoring
* retries
* backups
* security
* incident response

### Acceptance criteria

* operational alerts exist
* restores tested
* secrets never committed

---

## E10. Launch and growth

### Stories

* beta onboarding
* feedback loop
* analytics
* experiments

### Acceptance criteria

* user behavior is measurable
* churn and retention can be tracked

---

# Story format to use

Use this template in Jira/Linear/Trello:

```text
Story
As a [role], I want [goal], so that [business value].

Acceptance Criteria
- ...
- ...
- ...

Tasks
- ...
- ...
- ...

Definition of Done
- tests pass
- reviewed
- merged
- deployed to staging
```

---

# Suggested sprint cadence

## Weekly operating rhythm

* **Monday:** sprint planning
* **Tuesday–Thursday:** build
* **Friday:** review/demo
* **Friday:** retro and backlog refinement

## Capacity split

* 70% feature work
* 20% bug fixing and refactoring
* 10% platform/ops work

---

# Release gates

## Alpha gate

* structured sutras imported
* retrieval works
* one advisor path works
* local model integration works

## Beta gate

* auth works
* memory works
* evaluation suite passes
* streaming UI works
* monitoring exists

## Production gate

* billing works
* backups tested
* security review complete
* rollback plan documented
* support process ready

---

# Critical invariants

* **No vector DB first**
* **No unstructured sutra storage**
* **No response without source grounding**
* **No production release without benchmark pass**
* **No billing before retention validation**
* **No memory without privacy controls**

---

# Recommended team split

If you are solo, this is the order:

1. **Data + ontology**
2. **Retrieval**
3. **Agent**
4. **Memory**
5. **Evaluation**
6. **UI**
7. **Billing**
8. **Production hardening**

If you have 2–3 people:

* **Engineer A:** backend + retrieval
* **Engineer B:** frontend + streaming UI
* **Engineer C:** ontology + evaluation + content tagging

---

# Final recommendation

Build Neeti in this exact order:

1. **Knowledge model**
2. **Ontology**
3. **Retrieval**
4. **Agent**
5. **Memory**
6. **Evaluation**
7. **UI**
8. **Billing**
9. **Hardening**
10. **Launch**

That sequence minimizes risk and gets you to a shippable product with the least wasted work.

If useful, I can turn this into a **Jira-ready backlog** with **epics, stories, acceptance criteria, and sprint-by-sprint tickets** in copy-paste format.

# Direct decision

Use **2-week Scrum sprints** with a **Kanban interrupt lane** for bugs, content fixes, and launch blockers.

This gives you:

* predictable delivery
* clear backlog structure
* measurable progress
* room for production issues without breaking the sprint

The build should follow the stack we already narrowed down:

```text
Rails 8 API
PostgreSQL
Solid Queue / Cache / Cable
React + TypeScript
Ollama for local dev
Cloud LLM fallback in production
Structured RAG first
No LangChain / Qdrant / Neo4j in v1
```

---

# Agile operating model

## Cadence

* **Sprint length:** 2 weeks
* **Planning:** 2–3 hours at sprint start
* **Daily standup:** 15 minutes
* **Backlog refinement:** 60 minutes mid-sprint
* **Review/demo:** end of sprint
* **Retro:** immediately after review

## Delivery rules

* Every story must have:

  * user value
  * acceptance criteria
  * test coverage
  * observability impact
  * rollback note if production-facing

* Every sprint must end with:

  * a working increment
  * demoable functionality
  * no broken main branch

---

# Product backlog structure

## Epics

| Epic                     | Outcome                                |
| ------------------------ | -------------------------------------- |
| E1. Foundation           | Repo, standards, environments, CI/CD   |
| E2. Knowledge base       | Sutras, chapters, ontology, tagging    |
| E3. Retrieval engine     | Metadata, FTS, theme graph, ranking    |
| E4. Agent runtime        | Prompting, tool use, citations, safety |
| E5. Memory               | Session memory, long-term insights     |
| E6. Evaluation           | Benchmark queries, regression checks   |
| E7. UI/UX                | Chat, streaming, sources, history      |
| E8. Auth & billing       | Signup, subscriptions, quotas          |
| E9. Production hardening | Monitoring, backups, security, scaling |
| E10. Launch & growth     | Beta, retention, onboarding, analytics |

---

# Complete sprint plan

## Sprint 0 — Project foundation

**Goal:** create the production-grade base.

### Stories

* As a developer, I can clone and run the project locally.
* As a developer, I can run API, DB, queue, and frontend together.
* As a team, we have coding and branching standards.

### Tasks

* Create Rails 8 API app
* Create React + TypeScript app
* Set up PostgreSQL
* Add Solid Queue, Cache, Cable
* Set up Docker Compose
* Add environment files
* Add linting/formatting
* Add test stack
* Add CI pipeline
* Add health endpoints
* Define architecture folder structure

### Done when

* `docker compose up` works
* CI passes on PRs
* empty app boots locally

---

## Sprint 1 — Sutra corpus and schema

**Goal:** structure Chanakya Neeti into the database.

### Stories

* As a system, I can store sutras with canonical IDs.
* As a system, I can store chapters and metadata.
* As a system, I can tag sutras with themes, virtues, vices, situations, emotions.

### Tasks

* Design schema
* Create tables:

  * `chapters`
  * `sutras`
  * `themes`
  * `virtues`
  * `vices`
  * `situations`
  * `emotions`
  * join tables
  * `theme_relationships`
* Build import script for CSV/JSON
* Normalize canonical sutra IDs
* Seed initial ontology
* Add validation and import logs
* Add tests for import correctness

### Done when

* all sutras imported
* ontology exists
* data is queryable structurally

---

## Sprint 2 — Ontology and tagging system

**Goal:** make the knowledge base semantically useful.

### Stories

* As a system, I can infer theme tags from sutra content.
* As an admin, I can review and correct tags.
* As a system, I can map relationships between concepts.

### Tasks

* Create master taxonomy for:

  * virtues
  * vices
  * situations
  * emotions
  * actor roles
* Add theme relationship definitions
* Build rule-based tagging helper
* Add optional LLM-assisted tag suggestion
* Add review console/task
* Add consistency checks
* Add duplicate/conflict validation

### Done when

* every sutra has a usable tag set
* concepts are linked through relationships
* ontology is consistent

---

## Sprint 3 — Retrieval engine v1

**Goal:** return the right sutras quickly and explainably.

### Stories

* As a user, I can ask a question and get relevant sutras.
* As a system, I can search by metadata and text.
* As a system, I can expand results using theme relationships.

### Tasks

* Build metadata retriever
* Build PostgreSQL full-text search
* Build recursive graph expansion with CTEs
* Add result scoring
* Add deduplication
* Add fallback logic if no strong match
* Add retrieval logging and trace IDs
* Add tests for standard query scenarios

### Done when

* a query returns relevant sutras
* retrieval is explainable
* latency is acceptable locally

---

## Sprint 4 — Agent runtime and model router

**Goal:** convert retrieval into grounded advice.

### Stories

* As a user, I receive answers grounded in sutras.
* As a system, I can switch between local and cloud models.
* As a system, I can enforce persona and output structure.

### Tasks

* Implement `LLMRouter`
* Integrate Ollama for development
* Add cloud fallback for production
* Build agent service:

  * analyze query
  * retrieve sutras
  * synthesize response
  * validate response
* Add prompt template
* Add citation formatting
* Add refusal rules for unsafe/unsupported queries
* Add output schema validation

### Done when

* one question becomes one cited answer
* model switching works
* response format is stable

---

## Sprint 5 — Memory and personalization

**Goal:** make the advisor remember users.

### Stories

* As a user, the advisor remembers my history.
* As a system, I can store short-term context.
* As a system, I can extract long-term insights safely.

### Tasks

* Create conversation tables
* Create user insight tables
* Add memory write flow
* Add memory retrieval flow
* Add insight extraction job
* Add summarization of old threads
* Add retention and deletion rules
* Add privacy controls

### Done when

* user context persists across sessions
* memory is queryable
* retention is controlled

---

## Sprint 6 — Evaluation framework

**Goal:** stop quality regressions.

### Stories

* As a team, we can benchmark response quality.
* As a team, we can detect retrieval regressions.
* As a team, we can compare prompt/model changes.

### Tasks

* Build evaluation dataset of 50–100 queries
* Define expected sutras/themes per query
* Add benchmark runner
* Add scoring metrics:

  * retrieval precision
  * retrieval recall
  * faithfulness
  * style adherence
  * citation coverage
* Add regression tests in CI
* Add low-score alerts

### Done when

* every major change can be benchmarked
* regressions are visible before release

---

## Sprint 7 — UI/UX and streaming

**Goal:** make the product usable and engaging.

### Stories

* As a user, I can chat in real time.
* As a user, I can see sources.
* As a user, I can revisit past advice.

### Tasks

* Build chat UI
* Add SSE streaming
* Render sutra cards
* Render citations and explanation
* Add conversation history
* Add loading/error states
* Add responsive mobile layout
* Add onboarding empty state

### Done when

* chat feels realtime
* sources are visible
* mobile UX is usable

---

## Sprint 8 — Authentication, plans, and billing

**Goal:** turn usage into revenue.

### Stories

* As a user, I can sign up and log in.
* As a user, I can subscribe to a plan.
* As a system, I can enforce usage limits.

### Tasks

* Add auth flow
* Add account settings
* Add subscription plans
* Integrate Razorpay
* Add payment webhook handling
* Add plan quota checks
* Add usage tracking
* Add plan upgrade/downgrade flow
* Add invoice/receipt handling

### Done when

* paid plans work end-to-end
* quotas are enforced
* failed payments are handled cleanly

---

## Sprint 9 — Production hardening

**Goal:** make the system safe and observable.

### Stories

* As an operator, I can monitor health and performance.
* As an operator, I can recover from failures.
* As a user, my data is protected.

### Tasks

* Add structured logging
* Add error monitoring
* Add request tracing
* Add job retries and dead-letter handling
* Add backups and restore tests
* Add rate limiting
* Add secrets management
* Add audit logs
* Add security review checklist
* Add disaster recovery runbook

### Done when

* monitoring exists
* backups are validated
* security baseline is complete

---

## Sprint 10 — Beta launch and retention

**Goal:** validate usage and behavior in the real world.

### Stories

* As a user, I receive a daily sutra.
* As a user, I can continue from prior sessions.
* As a team, we can measure retention.

### Tasks

* Add daily sutra scheduler
* Add notifications
* Add analytics events
* Add onboarding flow
* Add feedback capture
* Add retention dashboards
* Add cohort analysis
* Add feature flags
* Add support workflow

### Done when

* beta is live
* retention is measurable
* user feedback is flowing

---

# Epic details

## E1. Foundation

Focus:

* repo hygiene
* environment parity
* CI/CD
* standards

## E2. Knowledge base

Focus:

* sutra import
* metadata richness
* ontology quality

## E3. Retrieval engine

Focus:

* structured search
* FTS
* graph expansion
* ranking

## E4. Agent runtime

Focus:

* routing
* prompt discipline
* tool use
* citations

## E5. Memory

Focus:

* conversation persistence
* insight extraction
* privacy

## E6. Evaluation

Focus:

* benchmark set
* scoring
* regression testing

## E7. UI/UX

Focus:

* chat
* streaming
* source visibility
* history

## E8. Billing

Focus:

* plans
* quotas
* payments
* webhooks

## E9. Hardening

Focus:

* logs
* metrics
* alerts
* backups
* recovery

## E10. Launch

Focus:

* onboarding
* retention
* feedback
* analytics

---

# Story format to use

Use this exact template in Jira/Linear:

```text
Story
As a [role], I want [goal], so that [business value].

Acceptance Criteria
- ...
- ...
- ...

Tasks
- ...
- ...
- ...

Definition of Done
- tests pass
- reviewed
- merged
- deployed
```

---

# Acceptance gates

## Alpha

* sutras imported
* ontology exists
* retrieval works
* one answer path works

## Beta

* auth works
* memory works
* evaluation suite passes
* UI streams responses
* monitoring exists

## Production

* billing works
* backups tested
* security reviewed
* rollback plan documented
* support ready

---

# Critical invariants

* No vector-first architecture in v1
* No unstructured sutra storage
* No answer without citations
* No billing before retention proof
* No memory without privacy controls
* No production release without benchmark pass

---

# Recommended team allocation

## Solo founder

Do it in this order:

1. ontology
2. schema
3. retrieval
4. agent
5. memory
6. evaluation
7. UI
8. billing
9. hardening

## 2–3 engineers

Split as:

* **Engineer A:** backend, schema, retrieval
* **Engineer B:** frontend, streaming UI, billing
* **Engineer C:** ontology, evaluation, content tagging

---

# Practical sprint sequence

If you want the shortest path to something usable:

1. **Sprint 0:** foundation
2. **Sprint 1:** sutras and schema
3. **Sprint 2:** ontology
4. **Sprint 3:** retrieval
5. **Sprint 4:** agent
6. **Sprint 5:** memory
7. **Sprint 6:** evaluation
8. **Sprint 7:** UI
9. **Sprint 8:** billing
10. **Sprint 9:** hardening
11. **Sprint 10:** beta and retention

---

# Final recommendation

Build in this order:

**knowledge model → ontology → retrieval → agent → memory → evaluation → UI → billing → hardening → launch**

That is the cleanest path from scratch to production without wasting time on premature infrastructure.

If you want, I can turn this into a **Jira-ready backlog document** with **epics, stories, acceptance criteria, dependencies, and sprint estimates** in a copy-paste format.
