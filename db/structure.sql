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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


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
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.themes, ' '), '')), 'C') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.situations, ' '), '')), 'C');
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
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    title text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
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
    updated_at timestamp(6) without time zone NOT NULL
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
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


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
    updated_at timestamp(6) without time zone NOT NULL
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
    daily_reset_at date DEFAULT CURRENT_DATE,
    razorpay_customer_id text,
    razorpay_subscription_id text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
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
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: sutras id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutras ALTER COLUMN id SET DEFAULT nextval('public.sutras_id_seq'::regclass);


--
-- Name: themes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes ALTER COLUMN id SET DEFAULT nextval('public.themes_id_seq'::regclass);


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
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sutras sutras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sutras
    ADD CONSTRAINT sutras_pkey PRIMARY KEY (id);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


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
-- Name: index_conversations_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_conversations_on_user_id ON public.conversations USING btree (user_id);


--
-- Name: index_messages_on_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: index_messages_on_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_role ON public.messages USING btree (role);


--
-- Name: index_sutras_on_canonical_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sutras_on_canonical_id ON public.sutras USING btree (canonical_id);


--
-- Name: index_sutras_on_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_chapter ON public.sutras USING btree (chapter);


--
-- Name: index_sutras_on_emotions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sutras_on_emotions ON public.sutras USING gin (emotions);


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
-- Name: index_themes_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_themes_on_name ON public.themes USING btree (name);


--
-- Name: index_themes_on_related_theme_names; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_themes_on_related_theme_names ON public.themes USING gin (related_theme_names);


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
-- Name: sutras sutras_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sutras_search_vector_trigger BEFORE INSERT OR UPDATE ON public.sutras FOR EACH ROW EXECUTE FUNCTION public.sutras_search_vector_update();


--
-- Name: user_insights user_insights_sv_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_insights_sv_trigger BEFORE INSERT OR UPDATE ON public.user_insights FOR EACH ROW EXECUTE FUNCTION public.user_insights_sv_update();


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
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20260101000006'),
('20260101000005'),
('20260101000004'),
('20260101000003'),
('20260101000002'),
('20260101000001');

