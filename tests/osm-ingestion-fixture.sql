-- Run only against an empty, isolated PostgreSQL database.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE public.cities (id uuid PRIMARY KEY);
CREATE TABLE public.admin_users (id uuid PRIMARY KEY, auth_uid text, status text, role text, city_ids text[], email text);
CREATE TABLE public.civic_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), city_id uuid, name text, slug text, place_type text,
  description text, latitude double precision, longitude double precision, year_built int,
  year_demolished int, neighborhood text, status text, is_published boolean, updated_by uuid,
  updated_at timestamptz, ingestion_source text, ingestion_metadata jsonb
);
CREATE TABLE public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid, actor_admin_id uuid, actor_role text NOT NULL,
  action text NOT NULL, domain text NOT NULL, entity_type text, entity_id uuid, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.civic_places TO authenticated;
