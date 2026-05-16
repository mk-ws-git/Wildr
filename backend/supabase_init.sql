-- Wildr schema for Supabase
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query)
-- PostGIS is pre-enabled on Supabase; the CREATE EXTENSION line is safe to re-run.

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
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';
CREATE TYPE public.conservation_status_enum AS ENUM (
    'least_concern',
    'near_threatened',
    'vulnerable',
    'endangered',
    'critically_endangered',
    'extinct_in_wild',
    'extinct'
);
CREATE TYPE public.difficulty_enum AS ENUM (
    'easy',
    'moderate',
    'hard'
);
CREATE TYPE public.friendship_status AS ENUM (
    'pending',
    'accepted',
    'blocked'
);
CREATE TYPE public.kingdom_enum AS ENUM (
    'plant',
    'fungi',
    'bird',
    'insect',
    'mammal',
    'reptile',
    'amphibian',
    'fish',
    'other'
);
CREATE TYPE public.rarity_enum AS ENUM (
    'common',
    'uncommon',
    'rare',
    'very_rare'
);
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE public.badges (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon_url text,
    criteria text,
    category character varying(50)
);
CREATE SEQUENCE public.badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;
CREATE TABLE public.friendships (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    addressee_id integer NOT NULL,
    status public.friendship_status DEFAULT 'pending'::public.friendship_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;
CREATE TABLE public.greenspaces (
    id integer NOT NULL,
    osm_id bigint,
    name text,
    type character varying(50),
    geometry public.geography,
    centre_point public.geography(Point,4326),
    area_sqm double precision,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.greenspaces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.greenspaces_id_seq OWNED BY public.greenspaces.id;
CREATE TABLE public.location_reviews (
    id integer NOT NULL,
    user_id integer NOT NULL,
    location_id integer NOT NULL,
    rating smallint NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.location_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.location_reviews_id_seq OWNED BY public.location_reviews.id;
CREATE TABLE public.location_saves (
    id integer NOT NULL,
    user_id integer NOT NULL,
    location_id integer NOT NULL,
    saved_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.location_saves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.location_saves_id_seq OWNED BY public.location_saves.id;
CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100),
    centre_point public.geography(Point,4326),
    radius_metres integer,
    source character varying(20) DEFAULT 'auto'::character varying NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;
CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    payload jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
CREATE TABLE public.sightings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    species_id integer NOT NULL,
    location_id integer,
    location public.geography(Point,4326),
    photo_url text,
    audio_url text,
    waveform_data jsonb,
    notes text,
    identified_at timestamp with time zone DEFAULT now(),
    is_private boolean DEFAULT false
);
CREATE SEQUENCE public.sightings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.sightings_id_seq OWNED BY public.sightings.id;
CREATE TABLE public.species (
    id integer NOT NULL,
    common_name character varying(255) NOT NULL,
    scientific_name character varying(255) NOT NULL,
    kingdom public.kingdom_enum NOT NULL,
    rarity_tier public.rarity_enum,
    conservation_status public.conservation_status_enum,
    fun_fact text,
    habitat text,
    behaviour text,
    seasonal_note text,
    photos jsonb DEFAULT '[]'::jsonb NOT NULL,
    audio_urls jsonb DEFAULT '[]'::jsonb NOT NULL
);
CREATE SEQUENCE public.species_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.species_id_seq OWNED BY public.species.id;
CREATE TABLE public.species_saves (
    id integer NOT NULL,
    user_id integer NOT NULL,
    species_id integer NOT NULL,
    saved_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.species_saves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.species_saves_id_seq OWNED BY public.species_saves.id;
CREATE TABLE public.user_badges (
    id integer NOT NULL,
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    earned_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.user_badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.user_badges_id_seq OWNED BY public.user_badges.id;
CREATE TABLE public.user_locations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    location_id integer NOT NULL,
    visit_count integer DEFAULT 0,
    species_count integer DEFAULT 0,
    first_visited timestamp with time zone,
    last_visited timestamp with time zone
);
CREATE SEQUENCE public.user_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.user_locations_id_seq OWNED BY public.user_locations.id;
CREATE TABLE public.user_species (
    id integer NOT NULL,
    user_id integer NOT NULL,
    species_id integer NOT NULL,
    first_seen_at timestamp with time zone DEFAULT now(),
    added_to_list boolean DEFAULT false
);
CREATE SEQUENCE public.user_species_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.user_species_id_seq OWNED BY public.user_species.id;
CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password text NOT NULL,
    avatar_url text,
    bio text,
    location_name text,
    location_lat double precision,
    location_lng double precision,
    share_sightings_community boolean NOT NULL DEFAULT true,
    anonymize_community_sightings boolean NOT NULL DEFAULT false,
    share_sightings_inat boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
CREATE TABLE public.walk_completions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    walk_id integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.walk_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.walk_completions_id_seq OWNED BY public.walk_completions.id;
CREATE TABLE public.walk_reviews (
    id integer NOT NULL,
    user_id integer NOT NULL,
    walk_id integer NOT NULL,
    rating smallint NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.walk_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.walk_reviews_id_seq OWNED BY public.walk_reviews.id;
CREATE TABLE public.walk_sightings (
    id integer NOT NULL,
    walk_id integer NOT NULL,
    sighting_id integer NOT NULL
);
CREATE SEQUENCE public.walk_sightings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.walk_sightings_id_seq OWNED BY public.walk_sightings.id;
CREATE TABLE public.walk_stops (
    id integer NOT NULL,
    walk_id integer NOT NULL,
    location_id integer NOT NULL,
    stop_order integer NOT NULL,
    description text,
    audio_url text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.walk_stops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.walk_stops_id_seq OWNED BY public.walk_stops.id;
CREATE TABLE public.walks (
    id integer NOT NULL,
    created_by integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    difficulty public.difficulty_enum,
    estimated_duration_minutes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.walks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.walks_id_seq OWNED BY public.walks.id;
CREATE TABLE public.water_bodies (
    id integer NOT NULL,
    osm_id bigint,
    name text,
    type character varying(50),
    water_subtype character varying(50),
    is_swimming_spot boolean DEFAULT false,
    geometry public.geography,
    centre_point public.geography(Point,4326),
    area_sqm double precision,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.water_bodies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.water_bodies_id_seq OWNED BY public.water_bodies.id;
ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);
ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);
ALTER TABLE ONLY public.greenspaces ALTER COLUMN id SET DEFAULT nextval('public.greenspaces_id_seq'::regclass);
ALTER TABLE ONLY public.location_reviews ALTER COLUMN id SET DEFAULT nextval('public.location_reviews_id_seq'::regclass);
ALTER TABLE ONLY public.location_saves ALTER COLUMN id SET DEFAULT nextval('public.location_saves_id_seq'::regclass);
ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.sightings ALTER COLUMN id SET DEFAULT nextval('public.sightings_id_seq'::regclass);
ALTER TABLE ONLY public.species ALTER COLUMN id SET DEFAULT nextval('public.species_id_seq'::regclass);
ALTER TABLE ONLY public.species_saves ALTER COLUMN id SET DEFAULT nextval('public.species_saves_id_seq'::regclass);
ALTER TABLE ONLY public.user_badges ALTER COLUMN id SET DEFAULT nextval('public.user_badges_id_seq'::regclass);
ALTER TABLE ONLY public.user_locations ALTER COLUMN id SET DEFAULT nextval('public.user_locations_id_seq'::regclass);
ALTER TABLE ONLY public.user_species ALTER COLUMN id SET DEFAULT nextval('public.user_species_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
ALTER TABLE ONLY public.walk_completions ALTER COLUMN id SET DEFAULT nextval('public.walk_completions_id_seq'::regclass);
ALTER TABLE ONLY public.walk_reviews ALTER COLUMN id SET DEFAULT nextval('public.walk_reviews_id_seq'::regclass);
ALTER TABLE ONLY public.walk_sightings ALTER COLUMN id SET DEFAULT nextval('public.walk_sightings_id_seq'::regclass);
ALTER TABLE ONLY public.walk_stops ALTER COLUMN id SET DEFAULT nextval('public.walk_stops_id_seq'::regclass);
ALTER TABLE ONLY public.walks ALTER COLUMN id SET DEFAULT nextval('public.walks_id_seq'::regclass);
ALTER TABLE ONLY public.water_bodies ALTER COLUMN id SET DEFAULT nextval('public.water_bodies_id_seq'::regclass);
ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_name_key UNIQUE (name);
ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.greenspaces
    ADD CONSTRAINT greenspaces_osm_id_key UNIQUE (osm_id);
ALTER TABLE ONLY public.greenspaces
    ADD CONSTRAINT greenspaces_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.location_reviews
    ADD CONSTRAINT location_reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.location_reviews
    ADD CONSTRAINT location_reviews_user_id_location_id_key UNIQUE (user_id, location_id);
ALTER TABLE ONLY public.location_saves
    ADD CONSTRAINT location_saves_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.location_saves
    ADD CONSTRAINT location_saves_user_id_location_id_key UNIQUE (user_id, location_id);
ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sightings
    ADD CONSTRAINT sightings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.species
    ADD CONSTRAINT species_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.species_saves
    ADD CONSTRAINT species_saves_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.species_saves
    ADD CONSTRAINT species_saves_user_id_species_id_key UNIQUE (user_id, species_id);
ALTER TABLE ONLY public.species
    ADD CONSTRAINT species_scientific_name_key UNIQUE (scientific_name);
ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_user_id_location_id_key UNIQUE (user_id, location_id);
ALTER TABLE ONLY public.user_species
    ADD CONSTRAINT user_species_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_species
    ADD CONSTRAINT user_species_user_id_species_id_key UNIQUE (user_id, species_id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE ONLY public.walk_completions
    ADD CONSTRAINT walk_completions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.walk_completions
    ADD CONSTRAINT walk_completions_user_id_walk_id_key UNIQUE (user_id, walk_id);
ALTER TABLE ONLY public.walk_reviews
    ADD CONSTRAINT walk_reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.walk_reviews
    ADD CONSTRAINT walk_reviews_user_id_walk_id_key UNIQUE (user_id, walk_id);
ALTER TABLE ONLY public.walk_sightings
    ADD CONSTRAINT walk_sightings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.walk_sightings
    ADD CONSTRAINT walk_sightings_walk_id_sighting_id_key UNIQUE (walk_id, sighting_id);
ALTER TABLE ONLY public.walk_stops
    ADD CONSTRAINT walk_stops_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.walks
    ADD CONSTRAINT walks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.water_bodies
    ADD CONSTRAINT water_bodies_osm_id_key UNIQUE (osm_id);
ALTER TABLE ONLY public.water_bodies
    ADD CONSTRAINT water_bodies_pkey PRIMARY KEY (id);
CREATE INDEX greenspaces_centre_idx ON public.greenspaces USING gist (centre_point);
CREATE INDEX greenspaces_geometry_idx ON public.greenspaces USING gist (geometry);
CREATE INDEX idx_locations_centre_point ON public.locations USING gist (centre_point);
CREATE INDEX idx_sightings_location ON public.sightings USING gist (location);
CREATE INDEX water_bodies_centre_idx ON public.water_bodies USING gist (centre_point);
CREATE INDEX water_bodies_geometry_idx ON public.water_bodies USING gist (geometry);
CREATE INDEX water_bodies_swimming_idx ON public.water_bodies USING btree (is_swimming_spot) WHERE (is_swimming_spot = true);
ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.location_reviews
    ADD CONSTRAINT location_reviews_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE ONLY public.location_reviews
    ADD CONSTRAINT location_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.location_saves
    ADD CONSTRAINT location_saves_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE ONLY public.location_saves
    ADD CONSTRAINT location_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.sightings
    ADD CONSTRAINT sightings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE ONLY public.sightings
    ADD CONSTRAINT sightings_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.species(id);
ALTER TABLE ONLY public.sightings
    ADD CONSTRAINT sightings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.species_saves
    ADD CONSTRAINT species_saves_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.species(id);
ALTER TABLE ONLY public.species_saves
    ADD CONSTRAINT species_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);
ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.user_species
    ADD CONSTRAINT user_species_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.species(id);
ALTER TABLE ONLY public.user_species
    ADD CONSTRAINT user_species_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.walk_completions
    ADD CONSTRAINT walk_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.walk_completions
    ADD CONSTRAINT walk_completions_walk_id_fkey FOREIGN KEY (walk_id) REFERENCES public.walks(id);
ALTER TABLE ONLY public.walk_reviews
    ADD CONSTRAINT walk_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.walk_reviews
    ADD CONSTRAINT walk_reviews_walk_id_fkey FOREIGN KEY (walk_id) REFERENCES public.walks(id);
ALTER TABLE ONLY public.walk_sightings
    ADD CONSTRAINT walk_sightings_sighting_id_fkey FOREIGN KEY (sighting_id) REFERENCES public.sightings(id);
ALTER TABLE ONLY public.walk_sightings
    ADD CONSTRAINT walk_sightings_walk_id_fkey FOREIGN KEY (walk_id) REFERENCES public.walks(id);
ALTER TABLE ONLY public.walk_stops
    ADD CONSTRAINT walk_stops_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE ONLY public.walk_stops
    ADD CONSTRAINT walk_stops_walk_id_fkey FOREIGN KEY (walk_id) REFERENCES public.walks(id);
ALTER TABLE ONLY public.walks
    ADD CONSTRAINT walks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Seed data: species + badges
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (1, 'First Find', 'Log your first sighting', NULL, 'sightings_count >= 1');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (2, 'Naturalist', 'Log 10 sightings', NULL, 'sightings_count >= 10');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (3, 'Field Expert', 'Log 50 sightings', NULL, 'sightings_count >= 50');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (4, 'Curious Mind', 'Identify 5 unique species', NULL, 'species_count >= 5');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (5, 'Species Hunter', 'Identify 25 unique species', NULL, 'species_count >= 25');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (6, 'Encyclopaedia', 'Identify 50 unique species', NULL, 'species_count >= 50');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (7, 'Birder', 'Identify 10 bird species', NULL, 'bird_species_count >= 10');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (8, 'Botanist', 'Identify 10 plant species', NULL, 'plant_species_count >= 10');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (9, 'Fungi Finder', 'Identify 5 fungi species', NULL, 'fungi_species_count >= 5');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (10, 'Lucky Find', 'Identify a rare or very rare species', NULL, 'rare_species_count >= 1');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (11, 'Rare Spotter', 'Identify 3 very rare species', NULL, 'very_rare_species_count >= 3');
INSERT INTO public.badges (id, name, description, icon_url, criteria) VALUES (12, 'Guardian', 'Identify an endangered or critically endangered species', NULL, 'endangered_species_count >= 1');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (3, 'Northern Cardinal', 'Cardinalis cardinalis', 'bird', 'common', NULL, NULL, NULL, NULL, NULL, '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (7, 'Blue Jay', 'Cyanocitta cristata', 'bird', 'common', 'least_concern', 'Blue Jays can mimic the calls of hawks to scare other birds away from food sources.', 'Forests, parks, and suburban gardens across eastern and central North America.', 'Highly intelligent; caches thousands of acorns and seeds for winter use.', 'Partially migratory; some populations move south in autumn while others remain.', '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (14, 'Snowy Owl', 'Bubo scandiacus', 'bird', 'rare', 'vulnerable', 'Snowy Owls can locate prey under 60 cm of snow using hearing alone.', 'Open Arctic tundra for breeding; winters on open farmland, marshes, and coastlines.', 'Diurnal hunter in the 24-hour Arctic summer; hunts lemmings almost exclusively when breeding.', 'Irruptive migrant; in lemming crash years, large numbers move south into temperate regions.', '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (15, 'African Penguin', 'Spheniscus demersus', 'bird', 'rare', 'endangered', 'African Penguins make a distinctive braying call, earning them the nickname "jackass penguin".', 'Rocky coastlines and islands of southern Africa; forages up to 100 km offshore.', 'Monogamous; pairs return to the same nesting burrow each year and share incubation duties.', 'Breeds year-round with peaks in April and November; moults annually over 3 weeks on shore.', '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (16, 'Philippine Eagle', 'Pithecophaga jefferyi', 'bird', 'very_rare', 'critically_endangered', 'The Philippine Eagle is one of the largest and most powerful birds of prey in the world.', 'Old-growth rainforest in the Philippines, primarily on the island of Mindanao.', 'An apex predator; hunts flying lemurs, monkeys, and large bats through dense forest canopy.', 'Breeds once every two years; a single chick takes over a year to fledge.', '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (17, 'Spoon-billed Sandpiper', 'Eurynorhynchus pygmeus', 'bird', 'very_rare', 'critically_endangered', 'The Spoon-billed Sandpiper has a unique spatula-shaped bill found in no other bird.', 'Breeds on coastal tundra in northeast Russia; winters on mudflats in Southeast Asia.', 'Feeds by sweeping its spoon-shaped bill side to side through shallow water and soft mud.', 'Makes one of the longest migrations of any shorebird, travelling over 8,000 km each way.', '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (18, 'Kakapo', 'Strigops habroptilus', 'bird', 'very_rare', 'critically_endangered', 'The Kakapo is the world''s only flightless parrot and the heaviest parrot on Earth at up to 4 kg.', 'Native forest on predator-free islands off New Zealand, managed intensively by conservation staff.', 'Nocturnal and solitary; males boom from hilltop "leks" to attract females during breeding.', 'Boom years are triggered by mast-seeding rimu trees, meaning breeding may not occur for years.', '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (21, 'Marsh Tit', 'Poecile palustris', 'bird', 'common', NULL, 'The Marsh Tit can remember thousands of hiding spots where it has cached seeds, using a remarkable spatial memory that rivals any bird species. This cognitive ability helps it survive harsh winters by relocating its scattered food stores.', 'It inhabits deciduous and mixed woodlands, scrubland, and reed beds with dense vegetation across temperate Europe and Asia.', 'The Marsh Tit is notably vocal and territorial, producing a distinctive loud, ringing ''pitcher-pitcher-pitcher'' call that it uses to defend its territory throughout the year.', 'It is largely resident year-round across its range, though northern populations may migrate short distances south during severe winters.', '[]', '[]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (22, 'Blue Tit', 'Cyanistes caeruleus', 'bird', 'common', 'least_concern', 'Famous for learning to open foil milk-bottle tops — a behaviour that spread culturally across Europe.', 'Broadleaved woodland, gardens', 'Acrobatic; hangs upside down to reach caterpillars on leaf undersides', 'Resident; some irruption movements in autumn', '["https://commons.wikimedia.org/wiki/Special:FilePath/Cyanistes_caeruleus_-_Blue_tit_in_autumn_2009.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Blue_tit_in_Winthorpe_(8494).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Cyanistes_caeruleus_eating.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Cyanistes-caeruleus-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Parus_caeruleus_song.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (9, 'Great Tit', 'Parus major', 'bird', 'common', 'least_concern', 'Great Tits have over 40 distinct call types — one of the most complex vocal repertoires of any bird.', 'Woodland, parks, hedgerows, and gardens across Europe and Asia.', 'Dominant at garden feeders; uses its strong bill to hammer open nuts and seeds.', 'Resident year-round; begins singing its distinctive two-note call as early as January.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Parus_major_Roel_Smeets.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Tit_Parus_major_Kamchatka.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Great_tit_side-on.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Parus-major-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Parus_major_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (8, 'Barn Swallow', 'Hirundo rustica', 'bird', 'common', 'least_concern', 'Barn Swallows can travel over 11,000 km on migration between Europe and southern Africa.', 'Open countryside, farmland, and wetlands; nests inside barns and outbuildings.', 'Catches insects entirely in flight, skimming low over fields and water surfaces.', 'A classic summer visitor; arrives April–May and departs August–October.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Hirundo_rustica_-_Rasodraza,_Analamanga,_Madagascar-8.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Barn_swallow_(Hirundo_rustica_rustica)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Hirundo_rustica_-_Rasodraza_-_2008-08-02.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Hirundo-rustica-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Hirundo_rustica_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (6, 'Mallard', 'Anas platyrhynchos', 'bird', 'common', 'least_concern', 'The familiar "quack" sound is only made by females; males produce a quieter rasp.', 'Lakes, rivers, ponds, wetlands, and urban parks across the Northern Hemisphere.', 'Dabbles at the water surface rather than diving; tips up to reach submerged plants.', 'Breeds in spring; males moult into dull eclipse plumage after breeding season.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Mallard2.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Anas_platyrhynchos_male_female_quadrat.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Mallard_(Anas_platyrhynchos)_female_in_flight.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Anas-platyrhynchos-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Anas_platyrhynchos_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (23, 'Common Chaffinch', 'Fringilla coelebs', 'bird', 'common', 'least_concern', 'Its Latin name means ''celibate finch'' — Linnaeus observed females leaving in winter and males staying behind.', 'Woodland, farmland, gardens', 'Walks along ground picking up seeds; males sing repetitive descending phrases', 'Resident; large flocks of migrants pass through in October', '["https://commons.wikimedia.org/wiki/Special:FilePath/Fringilla_coelebs_chaffinch_male_edit2.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Fringilla_coelebs_female_1.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_chaffinch_(Fringilla_coelebs_coelebs)_male.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Fringilla-coelebs-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Fringilla_coelebs_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (24, 'Common Wood Pigeon', 'Columba palumbus', 'bird', 'common', 'least_concern', 'The largest pigeon in Europe; its five-note coo is one of the most recognisable countryside sounds.', 'Farmland, woodland, urban parks', 'Grazes in large flocks on crops and acorns', 'Resident; large migratory flocks arrive in autumn from Scandinavia', '["https://commons.wikimedia.org/wiki/Special:FilePath/Columba_palumbus_2_(Marek_Szczepanek).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Wood_Pigeon_Columba_palumbus.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Columba_palumbus_in_St_James''s_Park,_London_-_Nov_2008.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Columba-palumbus-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Columba_palumbus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (25, 'Eurasian Jay', 'Garrulus glandarius', 'bird', 'common', 'least_concern', 'A single jay can cache up to 5,000 acorns in autumn and remember most locations months later.', 'Deciduous and mixed woodland', 'Shy and elusive; alarm call a harsh screech', 'Resident; irruptions of northern birds some years', '["https://commons.wikimedia.org/wiki/Special:FilePath/Garrulus_glandarius_-_Flickr_-_Lip_Kee_(5).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Eurasian_Jay_Garrulus_glandarius.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Jay_-_Garrulus_glandarius.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Garrulus-glandarius-alarm.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Garrulus_glandarius_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (26, 'Common Magpie', 'Pica pica', 'bird', 'common', 'least_concern', 'Magpies are among the few non-mammal species that can recognise themselves in a mirror.', 'Farmland, woodland edges, gardens', 'Omnivorous and opportunistic; builds large domed nest of sticks', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Pica_pica_-_Compans_Caffarelli_-_2012-03-16.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Magpie_arp.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Eurasian_Magpie_Pica_pica.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Pica-pica-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Pica_pica_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (27, 'Carrion Crow', 'Corvus corone', 'bird', 'common', 'least_concern', 'Crows drop nuts onto roads and wait for cars to crack them open, using pedestrian crossings for safety.', 'Farmland, woodland, urban areas', 'Highly intelligent; uses tools and plays', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Corvus_corone_-_Crow_-_Corbeau_freux.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Corvus_corone_(Marek_Szczepanek).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Carrion_crow_(Corvus_corone)_3.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Corvus-corone-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Corvus_corone_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (28, 'Common Swift', 'Apus apus', 'bird', 'common', 'least_concern', 'Swifts can remain airborne for up to 10 months continuously, sleeping and mating on the wing.', 'Airspace over towns, villages and open country', 'Screaming flocks around rooftops in summer evenings', 'Summer visitor May–Aug', '["https://commons.wikimedia.org/wiki/Special:FilePath/Apus_apus_-_Flickr_-_Lip_Kee_(1).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_Swift_(Apus_apus)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Swift_apus_apus.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Apus-apus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Apus_apus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (29, 'White Stork', 'Ciconia ciconia', 'bird', 'uncommon', 'least_concern', 'In German folklore the White Stork delivers babies — a tradition tied to its return in spring.', 'Wet meadows, farmland, villages', 'Nests on rooftops and chimneys; pairs return to same nest each year', 'Summer visitor Mar–Aug; migrates to sub-Saharan Africa', '["https://commons.wikimedia.org/wiki/Special:FilePath/White_stork_(Ciconia_ciconia)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Weißstorch_Ciconia_ciconia.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Ciconia_ciconia_-_nesting.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Ciconia-ciconia-bill-clatter.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Ciconia_ciconia_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (30, 'Common Cuckoo', 'Cuculus canorus', 'bird', 'uncommon', 'least_concern', 'Each female cuckoo specialises in parasitising one host species and lays eggs that mimic that host''s eggs.', 'Woodland edges, heathland, wetlands', 'Brood parasite; male''s call signals spring arrival', 'Summer visitor Apr–Jul', '["https://commons.wikimedia.org/wiki/Special:FilePath/Cuculus_canorus_vogelartinfo.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_Cuckoo_(Cuculus_canorus)_calling.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Cuculus_canorus_in_flight.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Cuculus-canorus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Cuculus_canorus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (31, 'Eurasian Hoopoe', 'Upupa epops', 'bird', 'uncommon', 'least_concern', 'The national bird of Israel; its crest fans open dramatically when alarmed.', 'Open woodland, orchards, vineyards, sandy heaths', 'Probes soil with long curved bill; undulating butterfly-like flight', 'Rare summer visitor in southern Germany, Apr–Aug', '["https://commons.wikimedia.org/wiki/Special:FilePath/Upupa_epops_-_Luc_Viatour.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Upupa_epops_02.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Hoopoe_-_Upupa_epops.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Upupa-epops-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Upupa_epops_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (32, 'Grey Heron', 'Ardea cinerea', 'bird', 'common', 'least_concern', 'Can stand motionless for hours and strike with lightning speed — the heraldic symbol of patience.', 'Rivers, lakes, fish ponds, wetlands', 'Solitary hunter; nests colonially in tall trees', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Ardea_cinerea_-_Fishing_(2).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Grey_heron_(Ardea_cinerea)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Ardea_cinerea_standing.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Ardea-cinerea-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Ardea_cinerea_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (33, 'Mute Swan', 'Cygnus olor', 'bird', 'common', 'least_concern', 'Despite its name, Mute Swans make a variety of hisses, snorts and wing-beats audible from 1 km.', 'Lakes, rivers, urban ponds', 'Territorial; arches wings when threatened', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Cygnus_olor_-_Chiemsee_2009.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Mute_swan_Vrhnika.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Mute_swan_(Cygnus_olor)_in_flight.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Cygnus-olor-wingbeats.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Cygnus_olor_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (34, 'Eurasian Teal', 'Anas crecca', 'bird', 'uncommon', 'least_concern', 'Europe''s smallest dabbling duck; flocks take off almost vertically in tight formations.', 'Shallow wetlands, coastal marshes', 'Gregarious and swift in flight', 'Winter visitor Oct–Mar; small breeding population in north Germany', '["https://commons.wikimedia.org/wiki/Special:FilePath/Anas_crecca_-_Phaleron.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_teal_(Anas_crecca)_male_in_eclipse.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Anas_crecca_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Anas-crecca-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Anas_crecca_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (35, 'Common Buzzard', 'Buteo buteo', 'bird', 'common', 'least_concern', 'Germany''s most common raptor; its mewing call is often used in films as a generic ''eagle'' sound.', 'Woodland with open farmland', 'Soars in thermals; perches on fence posts waiting for prey', 'Resident year-round; augmented by migrants in winter', '["https://commons.wikimedia.org/wiki/Special:FilePath/Buteo_buteo_-_Raptor_in_flight_(1).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Buteo_buteo_(Common_Buzzard).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_Buzzard_Buteo_buteo.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Buteo-buteo-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Buteo_buteo_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (36, 'Common Kestrel', 'Falco tinnunculus', 'bird', 'common', 'least_concern', 'Kestrels can see UV light and use it to track vole urine trails invisible to the human eye.', 'Open farmland, motorway verges, urban edges', 'Hovers facing into wind; dives on small mammals', 'Resident; partial migrant', '["https://commons.wikimedia.org/wiki/Special:FilePath/Common_kestrel_(Falco_tinnunculus)_male.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Falco_tinnunculus_female_2.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Kestrel_falco_tinnunculus.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Falco-tinnunculus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Falco_tinnunculus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (37, 'Eurasian Sparrowhawk', 'Accipiter nisus', 'bird', 'common', 'least_concern', 'Females are 25% larger than males — one of the greatest size differences of any raptor.', 'Woodland, gardens, hedgerows', 'Ambush hunter; dashes through vegetation to catch small birds', 'Resident; large passage in autumn along coasts', '["https://commons.wikimedia.org/wiki/Special:FilePath/Accipiter_nisus_-_male_(1).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Accipiter_nisus_female.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Eurasian_Sparrowhawk_Accipiter_nisus.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Accipiter-nisus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Accipiter_nisus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (38, 'White-tailed Eagle', 'Haliaeetus albicilla', 'bird', 'rare', 'least_concern', 'Europe''s largest eagle with a wingspan up to 2.4 m — it was reintroduced to Germany after local extinction.', 'Large lakes, rivers, coastal areas', 'Soars on flat wings; steals fish from Ospreys', 'Resident in NE Germany; more widespread in winter', '["https://commons.wikimedia.org/wiki/Special:FilePath/Haliaeetus_albicilla_-_Białystok.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/White-tailed_eagle_(Haliaeetus_albicilla)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Haliaeetus_albicilla_adult.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Haliaeetus-albicilla-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Haliaeetus_albicilla_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (39, 'Osprey', 'Pandion haliaetus', 'bird', 'rare', 'least_concern', 'The only raptor that plunges feet-first into water; reversible outer toes grip slippery fish.', 'Large clear lakes and rivers', 'Hovers then plunge-dives; nests on poles and platforms', 'Summer visitor Apr–Sep; expanding breeding range in Germany', '["https://commons.wikimedia.org/wiki/Special:FilePath/Osprey_Pandion_haliaetus.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Pandion_haliaetus_-_Flickr_-_Lip_Kee.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Osprey_with_fish.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Pandion-haliaetus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Pandion_haliaetus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (40, 'Eurasian Woodcock', 'Scolopax rusticola', 'bird', 'uncommon', 'least_concern', 'One of the few birds with 360-degree vision — its eyes are set far back on its skull.', 'Dense deciduous and mixed woodland', 'Nocturnal; males perform ''roding'' display flights at dusk', 'Resident; large influx of migrants in autumn', '["https://commons.wikimedia.org/wiki/Special:FilePath/Scolopax_rusticola_1.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Woodcock_(Scolopax_rusticola)_camouflage.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Eurasian_Woodcock_Scolopax_rusticola.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Scolopax-rusticola-roding.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Scolopax_rusticola_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (41, 'Eurasian Curlew', 'Numenius arquata', 'bird', 'uncommon', 'near_threatened', 'Europe''s largest wader; its haunting, bubbling call epitomises wild upland landscapes.', 'Heathland, moorland; estuaries in winter', 'Long bill probes deep into mud for invertebrates', 'Breeding visitor upland areas; widespread on coasts in winter', '["https://commons.wikimedia.org/wiki/Special:FilePath/Numenius_arquata_-_Laem_Pak_Bia.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Eurasian_Curlew_(Numenius_arquata)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Numenius_arquata_calling.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Numenius-arquata-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Numenius_arquata_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (42, 'Common Sandpiper', 'Actitis hypoleucos', 'bird', 'uncommon', 'least_concern', 'Bobs its tail constantly — a behaviour whose function scientists still debate.', 'Rocky rivers and lakeshores', 'Walks with incessant tail-bobbing; low fast flight over water', 'Summer visitor May–Aug; common on passage', '["https://commons.wikimedia.org/wiki/Special:FilePath/Actitis_hypoleucos_-_Common_Sandpiper.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_sandpiper_(Actitis_hypoleucos)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Actitis_hypoleucos_standing.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Actitis-hypoleucos-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Actitis_hypoleucos_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (43, 'Black-headed Gull', 'Chroicocephalus ridibundus', 'bird', 'common', 'least_concern', 'Its ''black'' head is actually dark brown, and it disappears in winter to leave just a dark ear-spot.', 'Lakes, rivers, farmland, coasts', 'Follows the plough; aggressive mob behaviour at colonies', 'Resident and winter visitor; breeds on inland lakes', '["https://commons.wikimedia.org/wiki/Special:FilePath/Chroicocephalus_ridibundus_-_Black-headed_Gull.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Black-headed_gull_(Chroicocephalus_ridibundus)_winter.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Larus_ridibundus_in_flight.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Chroicocephalus-ridibundus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Larus_ridibundus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (44, 'Common Tern', 'Sterna hirundo', 'bird', 'uncommon', 'least_concern', 'Migrates from Germany to Antarctica and back — a round trip of up to 70,000 km a year.', 'Gravel banks, lakes, coasts', 'Hovers then plunge-dives for small fish', 'Summer visitor May–Sep', '["https://commons.wikimedia.org/wiki/Special:FilePath/Sterna_hirundo_-_Laem_Pak_Bia.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_tern_(Sterna_hirundo)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Sterna_hirundo_with_fish.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Sterna-hirundo-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Sterna_hirundo_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (45, 'Tawny Owl', 'Strix aluco', 'bird', 'common', 'least_concern', 'The classic ''tu-whit tu-whoo'' is actually a duet — the female calls ''ke-wick'', the male replies ''hooo''.', 'Deciduous woodland, parks, large gardens', 'Strictly nocturnal; hunts small mammals by sound', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Strix_aluco_-_Tawny_owl.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Tawny_owl_(Strix_aluco)_portrait.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Strix_aluco_standing.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Strix-aluco-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Strix_aluco_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (46, 'Long-eared Owl', 'Asio otus', 'bird', 'uncommon', 'least_concern', 'Its ear tufts are not ears at all — the actual ears are asymmetrically placed on the skull.', 'Mixed woodland edges, conifer plantations', 'Roosts communally in winter; hunts over open ground at night', 'Resident; augmented by continental migrants in winter', '["https://commons.wikimedia.org/wiki/Special:FilePath/Asio_otus_-_Long-eared_Owl.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Long-eared_owl_(Asio_otus)_portrait.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Asio_otus_in_roost.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Asio-otus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Asio_otus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (47, 'Eurasian Green Woodpecker', 'Picus viridis', 'bird', 'uncommon', 'least_concern', 'Its ''yaffle'' laughing call gave it the folk name ''yaffle'' in English; it rarely drums on wood.', 'Parkland, woodland edges, orchards', 'Hammers into ant hills with sticky tongue; bouncy flight', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Picus_viridis_-_European_Green_Woodpecker.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Green_woodpecker_(Picus_viridis)_male.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Picus_viridis_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Picus-viridis-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Picus_viridis_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (48, 'Great Spotted Woodpecker', 'Dendrocopos major', 'bird', 'common', 'least_concern', 'Drums up to 20 times per second without brain damage — its skull has special shock-absorbing bones.', 'Broadleaved and mixed woodland, parks', 'Loud drumming in spring; hangs on nut feeders', 'Resident year-round; irruptions of Scandinavian birds some autumns', '["https://commons.wikimedia.org/wiki/Special:FilePath/Dendrocopos_major_-_Great_Spotted_Woodpecker.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Great_spotted_woodpecker_(Dendrocopos_major)_male.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Dendrocopos_major_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Dendrocopos-major-drum.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Dendrocopos_major_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (49, 'Black Woodpecker', 'Dryocopus martius', 'bird', 'uncommon', 'least_concern', 'Europe''s largest woodpecker; excavates cavities later used by owls, ducks and bats.', 'Mature beech and pine forest', 'Crow-sized; loud wailing call; rectangular excavations in trees', 'Resident in suitable forest; expanding westward', '["https://commons.wikimedia.org/wiki/Special:FilePath/Dryocopus_martius_-_Black_Woodpecker.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Black_woodpecker_(Dryocopus_martius)_male.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Dryocopus_martius_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Dryocopus-martius-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Dryocopus_martius_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (50, 'Common Nightingale', 'Luscinia megarhynchos', 'bird', 'uncommon', 'least_concern', 'Sings by day AND night; its nocturnal song is strong enough to drown out traffic noise.', 'Dense scrub, thickets near water, woodland edges', 'Skulking; song extraordinarily complex and loud for its size', 'Summer visitor Apr–Aug', '["https://commons.wikimedia.org/wiki/Special:FilePath/Luscinia_megarhynchos_-_Common_Nightingale.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Nightingale_(Luscinia_megarhynchos)_singing.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Luscinia_megarhynchos_portrait.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Luscinia-megarhynchos-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Luscinia_megarhynchos_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (51, 'Common Redstart', 'Phoenicurus phoenicurus', 'bird', 'uncommon', 'least_concern', '''Redstart'' comes from Old English ''steort'' (tail) — it constantly quivers its orange-red tail.', 'Open woodland, orchards, parks with old trees', 'Perches upright and shivers tail; flycatcher habits', 'Summer visitor Apr–Sep', '["https://commons.wikimedia.org/wiki/Special:FilePath/Phoenicurus_phoenicurus_-_Common_Redstart.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_redstart_(Phoenicurus_phoenicurus)_male.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Phoenicurus_phoenicurus_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Phoenicurus-phoenicurus-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Phoenicurus_phoenicurus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (52, 'Fieldfare', 'Turdus pilaris', 'bird', 'uncommon', 'least_concern', 'Nesting Fieldfares dive-bomb predators and defecate on them — a surprisingly effective deterrent.', 'Farmland, hedgerows, orchards in winter', 'Flocks strip berry-laden trees; chacking call in flight', 'Winter visitor Oct–Mar; occasional breeder in northern Germany', '["https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_pilaris_-_Fieldfare.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Fieldfare_(Turdus_pilaris)_in_winter.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_pilaris_in_flight.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Turdus-pilaris-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_pilaris_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (53, 'Song Thrush', 'Turdus philomelos', 'bird', 'common', 'least_concern', 'The only bird known to use a ''hammer'' — a stone or hard surface — to crack open snail shells.', 'Woodland, gardens, parks', 'Repeats each phrase two or three times; smashes snails on anvil', 'Resident; northern populations winter further south', '["https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_philomelos_-_Song_Thrush.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Song_thrush_(Turdus_philomelos)_singing.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_philomelos_feeding.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Turdus-philomelos-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_philomelos_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (54, 'Goldcrest', 'Regulus regulus', 'bird', 'common', 'least_concern', 'Europe''s smallest bird at around 5 g; yet it migrates thousands of kilometres across the North Sea.', 'Conifer woodland, mixed forest', 'Constantly flicks wings; high-pitched ''seee'' call', 'Resident; large numbers of migrants arrive in autumn', '["https://commons.wikimedia.org/wiki/Special:FilePath/Regulus_regulus_-_Goldcrest.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Goldcrest_(Regulus_regulus)_portrait.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Regulus_regulus_in_conifer.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Regulus-regulus-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Regulus_regulus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (55, 'Long-tailed Tit', 'Aegithalos caudatus', 'bird', 'common', 'least_concern', 'Its domed nest is made of lichen, cobwebs and up to 2,000 feathers — perfectly insulated.', 'Woodland edges, hedgerows, gardens', 'Moves in noisy flocks; relatives help raise each other''s chicks', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Aegithalos_caudatus_-_Long-tailed_Tit.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Long-tailed_tit_(Aegithalos_caudatus)_in_winter.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Aegithalos_caudatus_flock.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Aegithalos-caudatus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Aegithalos_caudatus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (56, 'Eurasian Nuthatch', 'Sitta europaea', 'bird', 'common', 'least_concern', 'The only bird that can walk headfirst down a tree trunk — it doesn''t need to reverse.', 'Mature deciduous woodland, parkland', 'Wedges nuts in bark to crack them; plasters nest hole with mud', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Sitta_europaea_-_Eurasian_Nuthatch.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Nuthatch_(Sitta_europaea)_on_branch.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Sitta_europaea_headfirst.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Sitta-europaea-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Sitta_europaea_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (57, 'Common Treecreeper', 'Certhia familiaris', 'bird', 'common', 'least_concern', 'Always spirals upward on tree trunks, then flies to the base of the next tree and starts again.', 'Mature woodland, parkland with large trees', 'Mouse-like; pressed against bark; thin curved bill', 'Resident year-round', '["https://commons.wikimedia.org/wiki/Special:FilePath/Certhia_familiaris_-_Common_Treecreeper.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Treecreeper_(Certhia_familiaris)_spiralling.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Certhia_familiaris_bark.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Certhia-familiaris-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Certhia_familiaris_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (58, 'Yellowhammer', 'Emberiza citrinella', 'bird', 'uncommon', 'least_concern', 'Beethoven supposedly used its rhythm (''a-little-bit-of-bread-and-no-cheeese'') in the Fifth Symphony.', 'Farmland hedgerows, heathland', 'Males sing from exposed perches; flocks in winter stubble', 'Resident; declining across Germany', '["https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza_citrinella_-_Yellowhammer.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Yellowhammer_(Emberiza_citrinella)_male.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza_citrinella_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza-citrinella-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza_citrinella_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (59, 'Reed Bunting', 'Emberiza schoeniclus', 'bird', 'uncommon', 'least_concern', 'Now regularly nests in dry arable fields far from its traditional wetland habitat.', 'Reedbeds, wetland margins, increasingly arable', 'Males flick white outer tail feathers; jangling song', 'Resident; partial migrant; northern birds winter in Germany', '["https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza_schoeniclus_-_Reed_Bunting.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Reed_bunting_(Emberiza_schoeniclus)_male_breeding.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza_schoeniclus_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza-schoeniclus-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Emberiza_schoeniclus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (60, 'Corn Crake', 'Crex crex', 'bird', 'rare', 'least_concern', 'Its rasping double call carries over 1 km at night, yet the bird almost never shows itself.', 'Long grass meadows, hayfields', 'Crepuscular and nocturnal; calls persistently but hides in vegetation', 'Rare summer visitor; populations have crashed due to early mowing', '["https://commons.wikimedia.org/wiki/Special:FilePath/Crex_crex_-_Corncrake.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Corncrake_(Crex_crex)_in_grass.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Crex_crex_adult.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Crex-crex-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Crex_crex_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (61, 'Great Crested Grebe', 'Podiceps cristatus', 'bird', 'common', 'least_concern', 'Their elaborate courtship — the ''weed dance'' — was the subject of Julian Huxley''s pioneering 1914 study of animal behaviour.', 'Large lakes and reservoirs', 'Mirror-image courtship displays; chicks ride on parents'' backs', 'Resident year-round on larger water bodies', '["https://commons.wikimedia.org/wiki/Special:FilePath/Podiceps_cristatus_-_Great_Crested_Grebe.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Great_crested_grebe_(Podiceps_cristatus)_courtship.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Podiceps_cristatus_with_chick.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Podiceps-cristatus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Podiceps_cristatus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (62, 'Little Grebe', 'Tachybaptus ruficollis', 'bird', 'common', 'least_concern', 'Known as ''dabchick'' — it dives so swiftly it seems to vanish; nicknamed ''the disappearing act''.', 'Ponds, slow rivers, ditches', 'Dives frequently; trilling whinny duet in spring', 'Resident; moves to larger waters in hard winters', '["https://commons.wikimedia.org/wiki/Special:FilePath/Tachybaptus_ruficollis_-_Little_Grebe.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Little_grebe_(Tachybaptus_ruficollis)_breeding.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Tachybaptus_ruficollis_winter.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Tachybaptus-ruficollis-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Tachybaptus_ruficollis_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (63, 'Common Crane', 'Grus grus', 'bird', 'uncommon', 'least_concern', 'One of the world''s oldest bird species — fossils of closely related cranes date back 10 million years.', 'Wetlands, forests for breeding; open fields on migration', 'V-formation flocks of thousands pass over Germany in Oct–Nov', 'Passage migrant and winter visitor; small breeding population in NE Germany', '["https://commons.wikimedia.org/wiki/Special:FilePath/Grus_grus_-_Common_Crane.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Common_crane_(Grus_grus)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Grus_grus_flock_migration.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Grus-grus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Grus_grus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (64, 'European Bee-eater', 'Merops apiaster', 'bird', 'rare', 'least_concern', 'Catches bees and wasps in mid-air, then beats them against a branch to squeeze out the venom.', 'Sandy riverbanks, open country with scattered trees', 'Colonial nester in sandy slopes; colourful; liquid call', 'Rare breeder in south Germany; expanding northward with climate warming', '["https://commons.wikimedia.org/wiki/Special:FilePath/Merops_apiaster_-_European_Bee-eater.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/European_bee-eater_(Merops_apiaster)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Merops_apiaster_colony.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Merops-apiaster-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Merops_apiaster_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (65, 'Little Owl', 'Athene noctua', 'bird', 'uncommon', 'least_concern', 'Sacred to Athena in ancient Greece; its image appeared on Athenian coins.', 'Farmland with old trees, orchards, hedgerows', 'Active by day; bobs head when curious; barking call', 'Resident year-round; declining due to farmland changes', '["https://commons.wikimedia.org/wiki/Special:FilePath/Athene_noctua_-_Little_Owl.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Little_owl_(Athene_noctua)_portrait.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Athene_noctua_head_bob.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Athene-noctua-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Athene_noctua_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (66, 'Eurasian Golden Oriole', 'Oriolus oriolus', 'bird', 'uncommon', 'least_concern', 'Despite its brilliant yellow plumage, it hides in the canopy so well it is far more often heard than seen.', 'Mature broadleaved woodland, riverside poplars', 'Fluty whistled song; hammock nest woven between forked twigs', 'Summer visitor May–Aug', '["https://commons.wikimedia.org/wiki/Special:FilePath/Oriolus_oriolus_-_Golden_Oriole.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Golden_oriole_(Oriolus_oriolus)_male.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Oriolus_oriolus_female.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Oriolus-oriolus-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Oriolus_oriolus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (5, 'House Sparrow', 'Passer domesticus', 'bird', 'common', 'least_concern', 'House Sparrows take dust baths to help control parasites in their feathers.', 'Urban and suburban areas worldwide, closely associated with human settlements.', 'Highly social; forages in flocks and communicates with a wide range of chirps.', 'Breeds spring through summer; flocks increase in size through autumn and winter.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Passer_domesticus_male_(15).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Passer_domesticus_female_(8).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/House_sparrow04.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Passer-domesticus-song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Passer_domesticus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (10, 'Common Blackbird', 'Turdus merula', 'bird', 'common', 'least_concern', 'Blackbirds are among the first birds to sing at dawn and last to stop at dusk.', 'Woodland, parks, gardens, and hedgerows across Europe, Asia, and Australia.', 'Forages on the ground, cocking its head to listen for earthworms beneath the soil.', 'Sings most actively from February through July; resident year-round in most of Europe.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_merula_2.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Blackbird_(Turdus_merula)_male,_female_Wikimania_2014.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_merula_female_2.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Turdus_merula_song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Turdus-merula-mali-aaen.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (4, 'European Robin', 'Erithacus rubecula', 'bird', 'common', 'least_concern', 'Robins are one of the few birds to sing through winter, even at night near artificial lights.', 'Gardens, woodland edges, hedgerows, and parks across Europe and western Asia.', 'Famously bold around humans; will follow gardeners to catch unearthed worms.', 'Resident year-round in most of Europe; northern populations migrate south in autumn.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Robin-withno-worm.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Erithacus_rubecula_with_cocked_head.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Erithacus_rubecula_close.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Erithacus_rubecula_song.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Erithacus-rubecula-song.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (11, 'Common Kingfisher', 'Alcedo atthis', 'bird', 'uncommon', 'least_concern', 'Kingfishers have binocular vision underwater and can correct for light refraction when diving.', 'Clear, slow-moving rivers, streams, lakes, and canals with overhanging vegetation.', 'Perches motionless above water before plunge-diving to catch small fish.', 'Resident year-round; may move to estuaries and coasts in cold winters when rivers freeze.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Alcedo_atthis_-_Riserva_Naturale_di_Confluenza,_Italy_-_8.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Alcedo_atthis_male_-_Riserva_Naturale_di_Confluenza.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Kingfisher-Alcedo-atthis.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Alcedo-atthis-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Alcedo_atthis_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (13, 'Red Kite', 'Milvus milvus', 'bird', 'rare', 'least_concern', 'Red Kites decorate their nests with litter and scraps of clothing — researchers use this to track nests.', 'Open woodland, farmland, and hillsides; stronghold in Wales and reintroduced across England.', 'Soars effortlessly on thermals; its distinctive forked tail makes it easy to identify in flight.', 'Resident year-round in the UK; continental birds may join UK populations in winter.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Milvus_milvus_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Red_Kite_(Milvus_milvus)_in_flight_(2).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Milvus_milvus_-_forked_tail.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Milvus-milvus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Milvus_milvus_IBXSCH01.ogg"]');
INSERT INTO public.species (id, common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note, photos, audio_urls) VALUES (12, 'Peregrine Falcon', 'Falco peregrinus', 'bird', 'uncommon', 'least_concern', 'The Peregrine is the fastest animal on Earth, reaching over 320 km/h in a hunting stoop.', 'Cliff faces, tall buildings, bridges, and open country on every continent except Antarctica.', 'Hunts by stooping at high speed onto prey mid-air; kills with a blow from clenched talons.', 'Resident year-round in most of range; Arctic-breeding birds migrate south in winter.', '["https://commons.wikimedia.org/wiki/Special:FilePath/Falco_peregrinus_-_01_(cropped).jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Peregrine_falcon_(Falco_peregrinus)_in_flight.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Falco_peregrinus_adult.jpg"]', '["https://commons.wikimedia.org/wiki/Special:FilePath/Falco-peregrinus-call.ogg", "https://commons.wikimedia.org/wiki/Special:FilePath/Falco_peregrinus_IBXSCH01.ogg"]');

-- ─────────────────────────────────────────────
-- MIGRATIONS — apply manually via Supabase dashboard or MCP
-- ─────────────────────────────────────────────

-- 2026-05-16: role column on users (trusted / admin for backend-only gating)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role character varying(20) NOT NULL DEFAULT 'user';

-- 2026-05-16: content_flags table for community error reporting
CREATE TABLE IF NOT EXISTS public.content_flags (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type character varying(30) NOT NULL,  -- 'location', 'greenspace', 'species'
    content_id integer NOT NULL,
    reason text NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'open',  -- open / resolved / dismissed
    created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_flags_status_idx ON public.content_flags (status, created_at DESC);
