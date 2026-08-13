SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: sutras_search_vector_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sutras_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.translation_en, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.transliteration, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(
            (SELECT string_agg(themes.name, ' ')
             FROM sutra_themes st
             INNER JOIN themes ON themes.id = st.theme_id
             WHERE st.sutra_id = NEW.id),
            ''
          )), 'C') ||
          setweight(to_tsvector('english', coalesce(
            (SELECT string_agg(themes.name, ' ')
             FROM sutra_situations ss
             INNER JOIN themes ON themes.id = ss.theme_id
             WHERE ss.sutra_id = NEW.id),
            ''
          )), 'C');
        RETURN NEW;
      END
      $$;


--
-- Name: user_insights_sv_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_insights_sv_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
        RETURN NEW;
      END
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chats (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    agent_type character varying NOT NULL,
    title character varying,
    metadata text,
    message_count integer DEFAULT 0,
    total_cost numeric(15,6) DEFAULT 0.0,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: citations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citations (
    id bigint NOT NULL,
    consultation_id bigint NOT NULL,
    sutra_id bigint NOT NULL,
    "position" integer NOT NULL,
    relevance_rank integer,
    applied_interpretation text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: citations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citations_id_seq OWNED BY public.citations.id;


--
-- Name: collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collections (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying NOT NULL,
    description text,
    icon character varying DEFAULT '📁'::character varying,
    slug character varying,
    "position" integer DEFAULT 0,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: collections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.collections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.collections_id_seq OWNED BY public.collections.id;


--
-- Name: consultations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultations (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    parent_id bigint,
    public_id character varying NOT NULL,
    query_text text,
    title character varying,
    status integer DEFAULT 0 NOT NULL,
    routed_category character varying,
    detection_stage character varying,
    response_text text,
    retrieval_ms integer,
    generation_ms integer,
    model_used character varying,
    corpus_version character varying,
    citations_proposed integer DEFAULT 0 NOT NULL,
    gate_violations integer DEFAULT 0 NOT NULL,
    credits_consumed integer DEFAULT 0 NOT NULL,
    user_reaction integer,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: consultations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consultations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consultations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consultations_id_seq OWNED BY public.consultations.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    title text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    advisor character varying DEFAULT 'chanakya'::character varying NOT NULL
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: credit_ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_ledger_entries (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    consultation_id bigint,
    amount integer NOT NULL,
    transaction_type integer NOT NULL,
    description character varying,
    balance_after integer NOT NULL,
    idempotency_key character varying,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: credit_ledger_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_ledger_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: credit_ledger_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_ledger_entries_id_seq OWNED BY public.credit_ledger_entries.id;


--
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_chunks (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    content text NOT NULL,
    "position" integer NOT NULL,
    token_count integer DEFAULT 0,
    embedding double precision[] DEFAULT '{}'::double precision[],
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: document_chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_chunks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_chunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_chunks_id_seq OWNED BY public.document_chunks.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    collection_id bigint,
    filename character varying NOT NULL,
    title character varying,
    file_type character varying NOT NULL,
    file_size bigint DEFAULT 0,
    storage_key character varying,
    page_count integer DEFAULT 0,
    chunk_count integer DEFAULT 0,
    token_count integer DEFAULT 0,
    status character varying DEFAULT 'pending'::character varying,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: knowledge_packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_packs (
    id bigint NOT NULL,
    slug character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    icon character varying,
    color character varying,
    author character varying,
    version character varying,
    tier character varying DEFAULT 'free'::character varying,
    official boolean DEFAULT false,
    premium boolean DEFAULT false,
    node_count integer DEFAULT 0,
    edge_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: knowledge_packs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_packs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_packs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knowledge_packs_id_seq OWNED BY public.knowledge_packs.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    cited_sutra_ids bigint[] DEFAULT '{}'::bigint[],
    tokens_used integer,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    thinking_text text,
    thinking_tokens integer,
    output_tokens integer,
    input_tokens integer,
    total_cost numeric(15,6),
    thinking_cost numeric(15,6),
    chat_id bigint
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: retrieval_candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retrieval_candidates (
    id bigint NOT NULL,
    consultation_id bigint NOT NULL,
    sutra_id bigint NOT NULL,
    channel_ranks jsonb DEFAULT '{}'::jsonb NOT NULL,
    fused_score double precision NOT NULL,
    final_rank integer NOT NULL,
    was_cited boolean DEFAULT false NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: retrieval_candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.retrieval_candidates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: retrieval_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.retrieval_candidates_id_seq OWNED BY public.retrieval_candidates.id;


--
-- Name: safety_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safety_events (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    category character varying NOT NULL,
    detection_stage character varying NOT NULL,
    occurred_at timestamp(6) without time zone NOT NULL
);


--
-- Name: safety_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.safety_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: safety_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.safety_events_id_seq OWNED BY public.safety_events.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: solid_cable_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_cable_messages (
    id bigint NOT NULL,
    channel bytea NOT NULL,
    payload bytea NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    channel_hash bigint NOT NULL
);


--
-- Name: solid_cable_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_cable_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_cable_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_cable_messages_id_seq OWNED BY public.solid_cable_messages.id;


--
-- Name: solid_cache_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_cache_entries (
    id bigint NOT NULL,
    key bytea NOT NULL,
    value bytea NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    key_hash bigint NOT NULL,
    byte_size integer NOT NULL
);


--
-- Name: solid_cache_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_cache_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_cache_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_cache_entries_id_seq OWNED BY public.solid_cache_entries.id;


--
-- Name: solid_queue_blocked_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_blocked_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    queue_name character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    concurrency_key character varying NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_blocked_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_blocked_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_blocked_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_blocked_executions_id_seq OWNED BY public.solid_queue_blocked_executions.id;


--
-- Name: solid_queue_claimed_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_claimed_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    process_id bigint,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_claimed_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_claimed_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_claimed_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_claimed_executions_id_seq OWNED BY public.solid_queue_claimed_executions.id;


--
-- Name: solid_queue_failed_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_failed_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    error text,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_failed_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_failed_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_failed_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_failed_executions_id_seq OWNED BY public.solid_queue_failed_executions.id;


--
-- Name: solid_queue_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_jobs (
    id bigint NOT NULL,
    queue_name character varying NOT NULL,
    class_name character varying NOT NULL,
    arguments text,
    priority integer DEFAULT 0 NOT NULL,
    active_job_id character varying,
    scheduled_at timestamp(6) without time zone,
    finished_at timestamp(6) without time zone,
    concurrency_key character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_jobs_id_seq OWNED BY public.solid_queue_jobs.id;


--
-- Name: solid_queue_pauses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_pauses (
    id bigint NOT NULL,
    queue_name character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_pauses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_pauses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_pauses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_pauses_id_seq OWNED BY public.solid_queue_pauses.id;


--
-- Name: solid_queue_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_processes (
    id bigint NOT NULL,
    kind character varying NOT NULL,
    last_heartbeat_at timestamp(6) without time zone NOT NULL,
    supervisor_id bigint,
    pid integer NOT NULL,
    hostname character varying,
    metadata text,
    created_at timestamp(6) without time zone NOT NULL,
    name character varying NOT NULL
);


--
-- Name: solid_queue_processes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_processes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_processes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_processes_id_seq OWNED BY public.solid_queue_processes.id;


--
-- Name: solid_queue_ready_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_ready_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    queue_name character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_ready_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_ready_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_ready_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_ready_executions_id_seq OWNED BY public.solid_queue_ready_executions.id;


--
-- Name: solid_queue_recurring_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_recurring_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    task_key character varying NOT NULL,
    run_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_recurring_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_recurring_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_recurring_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_recurring_executions_id_seq OWNED BY public.solid_queue_recurring_executions.id;


--
-- Name: solid_queue_recurring_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_recurring_tasks (
    id bigint NOT NULL,
    key character varying NOT NULL,
    schedule character varying NOT NULL,
    command character varying(2048),
    class_name character varying,
    arguments text,
    queue_name character varying,
    priority integer DEFAULT 0,
    static boolean DEFAULT true NOT NULL,
    description text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_recurring_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_recurring_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_recurring_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_recurring_tasks_id_seq OWNED BY public.solid_queue_recurring_tasks.id;


--
-- Name: solid_queue_scheduled_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_scheduled_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    queue_name character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    scheduled_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_scheduled_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_scheduled_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_scheduled_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_scheduled_executions_id_seq OWNED BY public.solid_queue_scheduled_executions.id;


--
-- Name: solid_queue_semaphores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_semaphores (
    id bigint NOT NULL,
    key character varying NOT NULL,
    value integer DEFAULT 1 NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_semaphores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_semaphores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_semaphores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_semaphores_id_seq OWNED BY public.solid_queue_semaphores.id;


--
-- Name: sutra_emotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sutra_emotions (
    sutra_id bigint NOT NULL,
    theme_id bigint NOT NULL,
    id bigint NOT NULL
);


--
-- Name: sutra_emotions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sutra_emotions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sutra_emotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sutra_emotions_id_seq OWNED BY public.sutra_emotions.id;


--
-- Name: sutra_situations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sutra_situations (
    sutra_id bigint NOT NULL,
    theme_id bigint NOT NULL,
    id bigint NOT NULL
);


--
-- Name: sutra_situations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sutra_situations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sutra_situations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sutra_situations_id_seq OWNED BY public.sutra_situations.id;


--
-- Name: sutra_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sutra_themes (
    sutra_id bigint NOT NULL,
    theme_id bigint NOT NULL,
    id bigint NOT NULL
);


--
-- Name: sutra_themes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sutra_themes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sutra_themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sutra_themes_id_seq OWNED BY public.sutra_themes.id;


--
-- Name: sutra_vices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sutra_vices (
    sutra_id bigint NOT NULL,
    theme_id bigint NOT NULL,
    id bigint NOT NULL
);


--
-- Name: sutra_vices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sutra_vices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sutra_vices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sutra_vices_id_seq OWNED BY public.sutra_vices.id;


--
-- Name: sutra_virtues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sutra_virtues (
    sutra_id bigint NOT NULL,
    theme_id bigint NOT NULL,
    id bigint NOT NULL
);


--
-- Name: sutra_virtues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sutra_virtues_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sutra_virtues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sutra_virtues_id_seq OWNED BY public.sutra_virtues.id;


--
-- Name: sutras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sutras (
    id bigint NOT NULL,
    canonical_id text NOT NULL,
    sanskrit text,
    transliteration text,
    translation_en text NOT NULL,
    translation_hi text,
    chapter integer NOT NULL,
    chapter_title text,
    themes text[] DEFAULT '{}'::text[],
    virtues text[] DEFAULT '{}'::text[],
    vices text[] DEFAULT '{}'::text[],
    situations text[] DEFAULT '{}'::text[],
    emotions text[] DEFAULT '{}'::text[],
    search_vector tsvector,
    source_url text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    knowledge_pack_id bigint,
    advisory_status integer DEFAULT 0 NOT NULL,
    curation_note text,
    curated_by character varying,
    curated_at timestamp(6) without time zone,
    translation_source character varying,
    tone character varying,
    applicability character varying[] DEFAULT '{}'::character varying[],
    corpus_id bigint,
    embedding public.vector,
    embedding_model character varying,
    embedding_source_digest character varying,
    embedded_at timestamp(6) without time zone,
    CONSTRAINT chk_sutras_advisory_status CHECK (((advisory_status >= 0) AND (advisory_status <= 3))),
    CONSTRAINT chk_sutras_curated_when_decided CHECK (((advisory_status = 0) OR ((curated_by IS NOT NULL) AND (curated_at IS NOT NULL))))
);


--
-- Name: sutras_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sutras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sutras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sutras_id_seq OWNED BY public.sutras.id;


--
-- Name: theme_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_relationships (
    id bigint NOT NULL,
    source_theme_id bigint NOT NULL,
    target_theme_id bigint NOT NULL,
    relationship_type character varying DEFAULT 'related'::character varying NOT NULL,
    weight double precision DEFAULT 1.0,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: theme_relationships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.theme_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: theme_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.theme_relationships_id_seq OWNED BY public.theme_relationships.id;


--
-- Name: themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.themes (
    id bigint NOT NULL,
    name text NOT NULL,
    category text,
    related_theme_names text[] DEFAULT '{}'::text[],
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: themes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.themes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.themes_id_seq OWNED BY public.themes.id;


--
-- Name: tool_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tool_calls (
    id bigint NOT NULL,
    chat_id bigint NOT NULL,
    message_id bigint NOT NULL,
    tool_name character varying NOT NULL,
    arguments jsonb,
    result jsonb,
    success boolean DEFAULT true,
    error_message text,
    execution_time_ms integer,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: tool_calls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tool_calls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tool_calls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tool_calls_id_seq OWNED BY public.tool_calls.id;


--
-- Name: user_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_insights (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    insight_type text,
    content text NOT NULL,
    search_vector tsvector,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: user_insights_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_insights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_insights_id_seq OWNED BY public.user_insights.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email text NOT NULL,
    password_digest text NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    daily_query_count integer DEFAULT 0 NOT NULL,
    daily_reset_at date DEFAULT CURRENT_DATE NOT NULL,
    razorpay_customer_id text,
    razorpay_subscription_id text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    role character varying DEFAULT 'user'::character varying NOT NULL,
    installed_packs text[] DEFAULT '{chanakya,gita}'::text[],
    reset_token character varying,
    reset_sent_at timestamp(6) without time zone,
    token_version integer DEFAULT 0 NOT NULL,
    credit_balance integer DEFAULT 2 NOT NULL,
    last_credit_reset date
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: citations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citations ALTER COLUMN id SET DEFAULT nextval('public.citations_id_seq'::regclass);


--
-- Name: collections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections ALTER COLUMN id SET DEFAULT nextval('public.collections_id_seq'::regclass);


--
-- Name: consultations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations ALTER COLUMN id SET DEFAULT nextval('public.consultations_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: credit_ledger_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_ledger_entries ALTER COLUMN id SET DEFAULT nextval('public.credit_ledger_entries_id_seq'::regclass);


--
-- Name: document_chunks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks ALTER COLUMN id SET DEFAULT nextval('public.document_chunks_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: knowledge_packs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_packs ALTER COLUMN id SET DEFAULT nextval('public.knowledge_packs_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: retrieval_candidates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_candidates ALTER COLUMN id SET DEFAULT nextval('public.retrieval_candidates_id_seq'::regclass);


--
-- Name: safety_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_events ALTER COLUMN id SET DEFAULT nextval('public.safety_events_id_seq'::regclass);


--
-- Name: solid_cable_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cable_messages ALTER COLUMN id SET DEFAULT nextval('public.solid_cable_messages_id_seq'::regclass);


--
-- Name: solid_cache_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cache_entries ALTER COLUMN id SET DEFAULT nextval('public.solid_cache_entries_id_seq'::regclass);


--
-- Name: solid_queue_blocked_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_blocked_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_blocked_executions_id_seq'::regclass);


--
-- Name: solid_queue_claimed_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_claimed_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_claimed_executions_id_seq'::regclass);


--
-- Name: solid_queue_failed_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_failed_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_failed_executions_id_seq'::regclass);


--
-- Name: solid_queue_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_jobs ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_jobs_id_seq'::regclass);


--
-- Name: solid_queue_pauses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_pauses ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_pauses_id_seq'::regclass);


--
-- Name: solid_queue_processes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_processes ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_processes_id_seq'::regclass);


--
-- Name: solid_queue_ready_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_ready_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_ready_executions_id_seq'::regclass);


--
-- Name: solid_queue_recurring_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_recurring_executions_id_seq'::regclass);


--
-- Name: solid_queue_recurring_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_tasks ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_recurring_tasks_id_seq'::regclass);


--
-- Name: solid_queue_scheduled_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_scheduled_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_scheduled_executions_id_seq'::regclass);


--
-- Name: solid_queue_semaphores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_semaphores ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_semaphores_id_seq'::regclass);


--
-- Name: sutra_emotions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_emotions ALTER COLUMN id SET DEFAULT nextval('public.sutra_emotions_id_seq'::regclass);


--
-- Name: sutra_situations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_situations ALTER COLUMN id SET DEFAULT nextval('public.sutra_situations_id_seq'::regclass);


--
-- Name: sutra_themes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_themes ALTER COLUMN id SET DEFAULT nextval('public.sutra_themes_id_seq'::regclass);


--
-- Name: sutra_vices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_vices ALTER COLUMN id SET DEFAULT nextval('public.sutra_vices_id_seq'::regclass);


--
-- Name: sutra_virtues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_virtues ALTER COLUMN id SET DEFAULT nextval('public.sutra_virtues_id_seq'::regclass);


--
-- Name: sutras id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutras ALTER COLUMN id SET DEFAULT nextval('public.sutras_id_seq'::regclass);


--
-- Name: theme_relationships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_relationships ALTER COLUMN id SET DEFAULT nextval('public.theme_relationships_id_seq'::regclass);


--
-- Name: themes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes ALTER COLUMN id SET DEFAULT nextval('public.themes_id_seq'::regclass);


--
-- Name: tool_calls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_calls ALTER COLUMN id SET DEFAULT nextval('public.tool_calls_id_seq'::regclass);


--
-- Name: user_insights id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_insights ALTER COLUMN id SET DEFAULT nextval('public.user_insights_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: citations citations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citations
    ADD CONSTRAINT citations_pkey PRIMARY KEY (id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: credit_ledger_entries credit_ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_ledger_entries
    ADD CONSTRAINT credit_ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: knowledge_packs knowledge_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_packs
    ADD CONSTRAINT knowledge_packs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: retrieval_candidates retrieval_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_candidates
    ADD CONSTRAINT retrieval_candidates_pkey PRIMARY KEY (id);


--
-- Name: safety_events safety_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_events
    ADD CONSTRAINT safety_events_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: solid_cable_messages solid_cable_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cable_messages
    ADD CONSTRAINT solid_cable_messages_pkey PRIMARY KEY (id);


--
-- Name: solid_cache_entries solid_cache_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cache_entries
    ADD CONSTRAINT solid_cache_entries_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_blocked_executions solid_queue_blocked_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_blocked_executions
    ADD CONSTRAINT solid_queue_blocked_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_claimed_executions solid_queue_claimed_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_claimed_executions
    ADD CONSTRAINT solid_queue_claimed_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_failed_executions solid_queue_failed_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_failed_executions
    ADD CONSTRAINT solid_queue_failed_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_jobs solid_queue_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_jobs
    ADD CONSTRAINT solid_queue_jobs_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_pauses solid_queue_pauses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_pauses
    ADD CONSTRAINT solid_queue_pauses_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_processes solid_queue_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_processes
    ADD CONSTRAINT solid_queue_processes_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_ready_executions solid_queue_ready_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_ready_executions
    ADD CONSTRAINT solid_queue_ready_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_recurring_executions solid_queue_recurring_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_executions
    ADD CONSTRAINT solid_queue_recurring_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_recurring_tasks solid_queue_recurring_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_tasks
    ADD CONSTRAINT solid_queue_recurring_tasks_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_scheduled_executions solid_queue_scheduled_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_scheduled_executions
    ADD CONSTRAINT solid_queue_scheduled_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_semaphores solid_queue_semaphores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_semaphores
    ADD CONSTRAINT solid_queue_semaphores_pkey PRIMARY KEY (id);


--
-- Name: sutra_emotions sutra_emotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_emotions
    ADD CONSTRAINT sutra_emotions_pkey PRIMARY KEY (id);


--
-- Name: sutra_situations sutra_situations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_situations
    ADD CONSTRAINT sutra_situations_pkey PRIMARY KEY (id);


--
-- Name: sutra_themes sutra_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_themes
    ADD CONSTRAINT sutra_themes_pkey PRIMARY KEY (id);


--
-- Name: sutra_vices sutra_vices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_vices
    ADD CONSTRAINT sutra_vices_pkey PRIMARY KEY (id);


--
-- Name: sutra_virtues sutra_virtues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_virtues
    ADD CONSTRAINT sutra_virtues_pkey PRIMARY KEY (id);


--
-- Name: sutras sutras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutras
    ADD CONSTRAINT sutras_pkey PRIMARY KEY (id);


--
-- Name: theme_relationships theme_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_relationships
    ADD CONSTRAINT theme_relationships_pkey PRIMARY KEY (id);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: tool_calls tool_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_calls
    ADD CONSTRAINT tool_calls_pkey PRIMARY KEY (id);


--
-- Name: user_insights user_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_insights
    ADD CONSTRAINT user_insights_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_theme_relationships_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_theme_relationships_unique ON public.theme_relationships USING btree (source_theme_id, target_theme_id, relationship_type);


--
-- Name: index_chats_on_agent_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_chats_on_agent_type ON public.chats USING btree (agent_type);


--
-- Name: index_chats_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_chats_on_user_id ON public.chats USING btree (user_id);


--
-- Name: index_chats_on_user_id_and_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_chats_on_user_id_and_created_at ON public.chats USING btree (user_id, created_at);


--
-- Name: index_citations_on_consultation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_citations_on_consultation_id ON public.citations USING btree (consultation_id);


--
-- Name: index_citations_on_consultation_id_and_position; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_citations_on_consultation_id_and_position ON public.citations USING btree (consultation_id, "position");


--
-- Name: index_citations_on_consultation_id_and_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_citations_on_consultation_id_and_sutra_id ON public.citations USING btree (consultation_id, sutra_id);


--
-- Name: index_citations_on_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_citations_on_sutra_id ON public.citations USING btree (sutra_id);


--
-- Name: index_collections_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_collections_on_user_id ON public.collections USING btree (user_id);


--
-- Name: index_collections_on_user_id_and_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_collections_on_user_id_and_name ON public.collections USING btree (user_id, name);


--
-- Name: index_collections_on_user_id_and_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_collections_on_user_id_and_slug ON public.collections USING btree (user_id, slug);


--
-- Name: index_consultations_on_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_consultations_on_parent_id ON public.consultations USING btree (parent_id);


--
-- Name: index_consultations_on_public_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_consultations_on_public_id ON public.consultations USING btree (public_id);


--
-- Name: index_consultations_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_consultations_on_status ON public.consultations USING btree (status);


--
-- Name: index_consultations_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_consultations_on_user_id ON public.consultations USING btree (user_id);


--
-- Name: index_consultations_on_user_id_and_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_consultations_on_user_id_and_created_at ON public.consultations USING btree (user_id, created_at);


--
-- Name: index_conversations_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_conversations_on_user_id ON public.conversations USING btree (user_id);


--
-- Name: index_credit_ledger_entries_on_consultation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_credit_ledger_entries_on_consultation_id ON public.credit_ledger_entries USING btree (consultation_id);


--
-- Name: index_credit_ledger_entries_on_idempotency_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_credit_ledger_entries_on_idempotency_key ON public.credit_ledger_entries USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: index_credit_ledger_entries_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_credit_ledger_entries_on_user_id ON public.credit_ledger_entries USING btree (user_id);


--
-- Name: index_credit_ledger_entries_on_user_id_and_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_credit_ledger_entries_on_user_id_and_id ON public.credit_ledger_entries USING btree (user_id, id);


--
-- Name: index_document_chunks_on_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_document_chunks_on_document_id ON public.document_chunks USING btree (document_id);


--
-- Name: index_document_chunks_on_document_id_and_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_document_chunks_on_document_id_and_position ON public.document_chunks USING btree (document_id, "position");


--
-- Name: index_documents_on_collection_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_documents_on_collection_id ON public.documents USING btree (collection_id);


--
-- Name: index_documents_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_documents_on_user_id ON public.documents USING btree (user_id);


--
-- Name: index_documents_on_user_id_and_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_documents_on_user_id_and_status ON public.documents USING btree (user_id, status);


--
-- Name: index_knowledge_packs_on_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_knowledge_packs_on_slug ON public.knowledge_packs USING btree (slug);


--
-- Name: index_messages_on_chat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_chat_id ON public.messages USING btree (chat_id);


--
-- Name: index_messages_on_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: index_messages_on_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_role ON public.messages USING btree (role);


--
-- Name: index_retrieval_candidates_on_consultation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_retrieval_candidates_on_consultation_id ON public.retrieval_candidates USING btree (consultation_id);


--
-- Name: index_retrieval_candidates_on_consultation_id_and_final_rank; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_retrieval_candidates_on_consultation_id_and_final_rank ON public.retrieval_candidates USING btree (consultation_id, final_rank);


--
-- Name: index_retrieval_candidates_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_retrieval_candidates_on_created_at ON public.retrieval_candidates USING btree (created_at);


--
-- Name: index_retrieval_candidates_on_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_retrieval_candidates_on_sutra_id ON public.retrieval_candidates USING btree (sutra_id);


--
-- Name: index_safety_events_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_safety_events_on_user_id ON public.safety_events USING btree (user_id);


--
-- Name: index_safety_events_on_user_id_and_occurred_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_safety_events_on_user_id_and_occurred_at ON public.safety_events USING btree (user_id, occurred_at);


--
-- Name: index_solid_cable_messages_on_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cable_messages_on_channel ON public.solid_cable_messages USING btree (channel);


--
-- Name: index_solid_cable_messages_on_channel_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cable_messages_on_channel_hash ON public.solid_cable_messages USING btree (channel_hash);


--
-- Name: index_solid_cable_messages_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cable_messages_on_created_at ON public.solid_cable_messages USING btree (created_at);


--
-- Name: index_solid_cache_entries_on_byte_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cache_entries_on_byte_size ON public.solid_cache_entries USING btree (byte_size);


--
-- Name: index_solid_cache_entries_on_key_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_cache_entries_on_key_hash ON public.solid_cache_entries USING btree (key_hash);


--
-- Name: index_solid_cache_entries_on_key_hash_and_byte_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cache_entries_on_key_hash_and_byte_size ON public.solid_cache_entries USING btree (key_hash, byte_size);


--
-- Name: index_solid_queue_blocked_executions_for_maintenance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_blocked_executions_for_maintenance ON public.solid_queue_blocked_executions USING btree (expires_at, concurrency_key);


--
-- Name: index_solid_queue_blocked_executions_for_release; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_blocked_executions_for_release ON public.solid_queue_blocked_executions USING btree (concurrency_key, priority, job_id);


--
-- Name: index_solid_queue_blocked_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_blocked_executions_on_job_id ON public.solid_queue_blocked_executions USING btree (job_id);


--
-- Name: index_solid_queue_claimed_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_claimed_executions_on_job_id ON public.solid_queue_claimed_executions USING btree (job_id);


--
-- Name: index_solid_queue_claimed_executions_on_process_id_and_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_claimed_executions_on_process_id_and_job_id ON public.solid_queue_claimed_executions USING btree (process_id, job_id);


--
-- Name: index_solid_queue_dispatch_all; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_dispatch_all ON public.solid_queue_scheduled_executions USING btree (scheduled_at, priority, job_id);


--
-- Name: index_solid_queue_failed_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_failed_executions_on_job_id ON public.solid_queue_failed_executions USING btree (job_id);


--
-- Name: index_solid_queue_jobs_for_alerting; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_for_alerting ON public.solid_queue_jobs USING btree (scheduled_at, finished_at);


--
-- Name: index_solid_queue_jobs_for_filtering; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_for_filtering ON public.solid_queue_jobs USING btree (queue_name, finished_at);


--
-- Name: index_solid_queue_jobs_on_active_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_on_active_job_id ON public.solid_queue_jobs USING btree (active_job_id);


--
-- Name: index_solid_queue_jobs_on_class_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_on_class_name ON public.solid_queue_jobs USING btree (class_name);


--
-- Name: index_solid_queue_jobs_on_finished_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_on_finished_at ON public.solid_queue_jobs USING btree (finished_at);


--
-- Name: index_solid_queue_pauses_on_queue_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_pauses_on_queue_name ON public.solid_queue_pauses USING btree (queue_name);


--
-- Name: index_solid_queue_poll_all; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_poll_all ON public.solid_queue_ready_executions USING btree (priority, job_id);


--
-- Name: index_solid_queue_poll_by_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_poll_by_queue ON public.solid_queue_ready_executions USING btree (queue_name, priority, job_id);


--
-- Name: index_solid_queue_processes_on_last_heartbeat_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_processes_on_last_heartbeat_at ON public.solid_queue_processes USING btree (last_heartbeat_at);


--
-- Name: index_solid_queue_processes_on_name_and_supervisor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_processes_on_name_and_supervisor_id ON public.solid_queue_processes USING btree (name, supervisor_id);


--
-- Name: index_solid_queue_processes_on_supervisor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_processes_on_supervisor_id ON public.solid_queue_processes USING btree (supervisor_id);


--
-- Name: index_solid_queue_ready_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_ready_executions_on_job_id ON public.solid_queue_ready_executions USING btree (job_id);


--
-- Name: index_solid_queue_recurring_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_recurring_executions_on_job_id ON public.solid_queue_recurring_executions USING btree (job_id);


--
-- Name: index_solid_queue_recurring_executions_on_task_key_and_run_at; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_recurring_executions_on_task_key_and_run_at ON public.solid_queue_recurring_executions USING btree (task_key, run_at);


--
-- Name: index_solid_queue_recurring_tasks_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_recurring_tasks_on_key ON public.solid_queue_recurring_tasks USING btree (key);


--
-- Name: index_solid_queue_recurring_tasks_on_static; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_recurring_tasks_on_static ON public.solid_queue_recurring_tasks USING btree (static);


--
-- Name: index_solid_queue_scheduled_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_scheduled_executions_on_job_id ON public.solid_queue_scheduled_executions USING btree (job_id);


--
-- Name: index_solid_queue_semaphores_on_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_semaphores_on_expires_at ON public.solid_queue_semaphores USING btree (expires_at);


--
-- Name: index_solid_queue_semaphores_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_semaphores_on_key ON public.solid_queue_semaphores USING btree (key);


--
-- Name: index_solid_queue_semaphores_on_key_and_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_semaphores_on_key_and_value ON public.solid_queue_semaphores USING btree (key, value);


--
-- Name: index_sutra_emotions_on_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_emotions_on_sutra_id ON public.sutra_emotions USING btree (sutra_id);


--
-- Name: index_sutra_emotions_on_sutra_id_and_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sutra_emotions_on_sutra_id_and_theme_id ON public.sutra_emotions USING btree (sutra_id, theme_id);


--
-- Name: index_sutra_emotions_on_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_emotions_on_theme_id ON public.sutra_emotions USING btree (theme_id);


--
-- Name: index_sutra_situations_on_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_situations_on_sutra_id ON public.sutra_situations USING btree (sutra_id);


--
-- Name: index_sutra_situations_on_sutra_id_and_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sutra_situations_on_sutra_id_and_theme_id ON public.sutra_situations USING btree (sutra_id, theme_id);


--
-- Name: index_sutra_situations_on_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_situations_on_theme_id ON public.sutra_situations USING btree (theme_id);


--
-- Name: index_sutra_themes_on_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_themes_on_sutra_id ON public.sutra_themes USING btree (sutra_id);


--
-- Name: index_sutra_themes_on_sutra_id_and_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sutra_themes_on_sutra_id_and_theme_id ON public.sutra_themes USING btree (sutra_id, theme_id);


--
-- Name: index_sutra_themes_on_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_themes_on_theme_id ON public.sutra_themes USING btree (theme_id);


--
-- Name: index_sutra_vices_on_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_vices_on_sutra_id ON public.sutra_vices USING btree (sutra_id);


--
-- Name: index_sutra_vices_on_sutra_id_and_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sutra_vices_on_sutra_id_and_theme_id ON public.sutra_vices USING btree (sutra_id, theme_id);


--
-- Name: index_sutra_vices_on_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_vices_on_theme_id ON public.sutra_vices USING btree (theme_id);


--
-- Name: index_sutra_virtues_on_sutra_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_virtues_on_sutra_id ON public.sutra_virtues USING btree (sutra_id);


--
-- Name: index_sutra_virtues_on_sutra_id_and_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sutra_virtues_on_sutra_id_and_theme_id ON public.sutra_virtues USING btree (sutra_id, theme_id);


--
-- Name: index_sutra_virtues_on_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutra_virtues_on_theme_id ON public.sutra_virtues USING btree (theme_id);


--
-- Name: index_sutras_on_advisory_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_advisory_status ON public.sutras USING btree (advisory_status);


--
-- Name: index_sutras_on_applicability; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_applicability ON public.sutras USING gin (applicability);


--
-- Name: index_sutras_on_canonical_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sutras_on_canonical_id ON public.sutras USING btree (canonical_id);


--
-- Name: index_sutras_on_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_chapter ON public.sutras USING btree (chapter);


--
-- Name: index_sutras_on_corpus_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_corpus_id ON public.sutras USING btree (corpus_id);


--
-- Name: index_sutras_on_emotions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_emotions ON public.sutras USING gin (emotions);


--
-- Name: index_sutras_on_knowledge_pack_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_knowledge_pack_id ON public.sutras USING btree (knowledge_pack_id);


--
-- Name: index_sutras_on_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_search_vector ON public.sutras USING gin (search_vector);


--
-- Name: index_sutras_on_situations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_situations ON public.sutras USING gin (situations);


--
-- Name: index_sutras_on_themes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_themes ON public.sutras USING gin (themes);


--
-- Name: index_sutras_on_vices; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_vices ON public.sutras USING gin (vices);


--
-- Name: index_sutras_on_virtues; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_virtues ON public.sutras USING gin (virtues);


--
-- Name: index_theme_relationships_on_relationship_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_theme_relationships_on_relationship_type ON public.theme_relationships USING btree (relationship_type);


--
-- Name: index_theme_relationships_on_source_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_theme_relationships_on_source_theme_id ON public.theme_relationships USING btree (source_theme_id);


--
-- Name: index_theme_relationships_on_target_theme_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_theme_relationships_on_target_theme_id ON public.theme_relationships USING btree (target_theme_id);


--
-- Name: index_themes_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_themes_on_name ON public.themes USING btree (name);


--
-- Name: index_themes_on_related_theme_names; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_themes_on_related_theme_names ON public.themes USING gin (related_theme_names);


--
-- Name: index_tool_calls_on_chat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_tool_calls_on_chat_id ON public.tool_calls USING btree (chat_id);


--
-- Name: index_tool_calls_on_chat_id_and_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_tool_calls_on_chat_id_and_created_at ON public.tool_calls USING btree (chat_id, created_at);


--
-- Name: index_tool_calls_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_tool_calls_on_message_id ON public.tool_calls USING btree (message_id);


--
-- Name: index_tool_calls_on_tool_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_tool_calls_on_tool_name ON public.tool_calls USING btree (tool_name);


--
-- Name: index_user_insights_on_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_user_insights_on_search_vector ON public.user_insights USING gin (search_vector);


--
-- Name: index_user_insights_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_user_insights_on_user_id ON public.user_insights USING btree (user_id);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: index_users_on_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_reset_token ON public.users USING btree (reset_token);


--
-- Name: index_users_on_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_role ON public.users USING btree (role);


--
-- Name: sutras sutras_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sutras_search_vector_trigger BEFORE INSERT OR UPDATE ON public.sutras FOR EACH ROW EXECUTE FUNCTION public.sutras_search_vector_update();


--
-- Name: user_insights user_insights_sv_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_insights_sv_trigger BEFORE INSERT OR UPDATE ON public.user_insights FOR EACH ROW EXECUTE FUNCTION public.user_insights_sv_update();


--
-- Name: messages fk_rails_0f670de7ba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_rails_0f670de7ba FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: sutra_vices fk_rails_175c91a4ce; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_vices
    ADD CONSTRAINT fk_rails_175c91a4ce FOREIGN KEY (sutra_id) REFERENCES public.sutras(id) ON DELETE CASCADE;


--
-- Name: sutra_situations fk_rails_1de77a5a26; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_situations
    ADD CONSTRAINT fk_rails_1de77a5a26 FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: retrieval_candidates fk_rails_1f94229922; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_candidates
    ADD CONSTRAINT fk_rails_1f94229922 FOREIGN KEY (sutra_id) REFERENCES public.sutras(id);


--
-- Name: safety_events fk_rails_2aed3f8369; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_events
    ADD CONSTRAINT fk_rails_2aed3f8369 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: documents fk_rails_2be0318c46; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_rails_2be0318c46 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: solid_queue_recurring_executions fk_rails_318a5533ed; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_executions
    ADD CONSTRAINT fk_rails_318a5533ed FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: solid_queue_failed_executions fk_rails_39bbc7a631; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_failed_executions
    ADD CONSTRAINT fk_rails_39bbc7a631 FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: credit_ledger_entries fk_rails_3fc2e794d1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_ledger_entries
    ADD CONSTRAINT fk_rails_3fc2e794d1 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sutra_situations fk_rails_42530d284e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_situations
    ADD CONSTRAINT fk_rails_42530d284e FOREIGN KEY (sutra_id) REFERENCES public.sutras(id) ON DELETE CASCADE;


--
-- Name: sutra_emotions fk_rails_4b8db2778a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_emotions
    ADD CONSTRAINT fk_rails_4b8db2778a FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: theme_relationships fk_rails_4caaef8d50; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_relationships
    ADD CONSTRAINT fk_rails_4caaef8d50 FOREIGN KEY (source_theme_id) REFERENCES public.themes(id);


--
-- Name: solid_queue_blocked_executions fk_rails_4cd34e2228; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_blocked_executions
    ADD CONSTRAINT fk_rails_4cd34e2228 FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: sutra_virtues fk_rails_6a68fe41ad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_virtues
    ADD CONSTRAINT fk_rails_6a68fe41ad FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: retrieval_candidates fk_rails_73d30e454f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_candidates
    ADD CONSTRAINT fk_rails_73d30e454f FOREIGN KEY (consultation_id) REFERENCES public.consultations(id);


--
-- Name: user_insights fk_rails_7b73695c72; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_insights
    ADD CONSTRAINT fk_rails_7b73695c72 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: conversations fk_rails_7c15d62a0a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT fk_rails_7c15d62a0a FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages fk_rails_7f927086d2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_rails_7f927086d2 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: solid_queue_ready_executions fk_rails_81fcbd66af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_ready_executions
    ADD CONSTRAINT fk_rails_81fcbd66af FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: document_chunks fk_rails_99b41ada32; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT fk_rails_99b41ada32 FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: consultations fk_rails_9b0f4a6718; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT fk_rails_9b0f4a6718 FOREIGN KEY (parent_id) REFERENCES public.consultations(id);


--
-- Name: collections fk_rails_9b33697360; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT fk_rails_9b33697360 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tool_calls fk_rails_9c8daee481; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_calls
    ADD CONSTRAINT fk_rails_9c8daee481 FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: solid_queue_claimed_executions fk_rails_9cfe4d4944; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_claimed_executions
    ADD CONSTRAINT fk_rails_9cfe4d4944 FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: sutra_themes fk_rails_9e6ec9a518; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_themes
    ADD CONSTRAINT fk_rails_9e6ec9a518 FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: sutra_themes fk_rails_a00117ff1e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_themes
    ADD CONSTRAINT fk_rails_a00117ff1e FOREIGN KEY (sutra_id) REFERENCES public.sutras(id) ON DELETE CASCADE;


--
-- Name: sutras fk_rails_bf6a7448de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutras
    ADD CONSTRAINT fk_rails_bf6a7448de FOREIGN KEY (knowledge_pack_id) REFERENCES public.knowledge_packs(id);


--
-- Name: solid_queue_scheduled_executions fk_rails_c4316f352d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_scheduled_executions
    ADD CONSTRAINT fk_rails_c4316f352d FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: documents fk_rails_d1954ada41; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_rails_d1954ada41 FOREIGN KEY (collection_id) REFERENCES public.collections(id);


--
-- Name: sutra_emotions fk_rails_d2d4f6c425; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_emotions
    ADD CONSTRAINT fk_rails_d2d4f6c425 FOREIGN KEY (sutra_id) REFERENCES public.sutras(id) ON DELETE CASCADE;


--
-- Name: chats fk_rails_e555f43151; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT fk_rails_e555f43151 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: citations fk_rails_e598a99a1e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citations
    ADD CONSTRAINT fk_rails_e598a99a1e FOREIGN KEY (sutra_id) REFERENCES public.sutras(id);


--
-- Name: tool_calls fk_rails_e6051f6876; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_calls
    ADD CONSTRAINT fk_rails_e6051f6876 FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: theme_relationships fk_rails_ead6e0014c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_relationships
    ADD CONSTRAINT fk_rails_ead6e0014c FOREIGN KEY (target_theme_id) REFERENCES public.themes(id);


--
-- Name: consultations fk_rails_eb9663633d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT fk_rails_eb9663633d FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: credit_ledger_entries fk_rails_f65d36d41a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_ledger_entries
    ADD CONSTRAINT fk_rails_f65d36d41a FOREIGN KEY (consultation_id) REFERENCES public.consultations(id);


--
-- Name: sutra_virtues fk_rails_fb177f4673; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_virtues
    ADD CONSTRAINT fk_rails_fb177f4673 FOREIGN KEY (sutra_id) REFERENCES public.sutras(id) ON DELETE CASCADE;


--
-- Name: sutra_vices fk_rails_fda326cd00; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutra_vices
    ADD CONSTRAINT fk_rails_fda326cd00 FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: citations fk_rails_ff7cb7af44; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citations
    ADD CONSTRAINT fk_rails_ff7cb7af44 FOREIGN KEY (consultation_id) REFERENCES public.consultations(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20260809000003'),
('20260809000002'),
('20260809000001'),
('20260808000001'),
('20260712110223'),
('20260712083609'),
('20260712000005'),
('20260712000004'),
('20260712000003'),
('20260712000002'),
('20260712000001'),
('20260628000000'),
('20260627162945'),
('20260627000010'),
('20260609100000'),
('20260609000004'),
('20260609000003'),
('20260609000002'),
('20260609000001'),
('20260101000006'),
('20260101000005'),
('20260101000004'),
('20260101000003'),
('20260101000002'),
('20260101000001');

