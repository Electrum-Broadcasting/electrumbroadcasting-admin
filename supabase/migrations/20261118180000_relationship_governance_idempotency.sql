BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.relationship_governance_idempotency (
  actor_admin_id uuid NOT NULL,
  rpc_name text NOT NULL CHECK (rpc_name IN (
    'admin_replace_event_eras',
    'admin_replace_civic_relationship_set',
    'admin_replace_moment_relationships'
  )),
  idempotency_key uuid NOT NULL,
  request_hash bytea NOT NULL CHECK (pg_catalog.octet_length(request_hash) = 32),
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT relationship_governance_idempotency_pkey
    PRIMARY KEY (actor_admin_id, rpc_name, idempotency_key),
  CONSTRAINT relationship_governance_idempotency_response_object
    CHECK (response IS NULL OR pg_catalog.jsonb_typeof(response) = 'object')
);

ALTER TABLE public.relationship_governance_idempotency OWNER TO postgres;
ALTER TABLE public.relationship_governance_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_governance_idempotency FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.relationship_governance_idempotency
  FROM PUBLIC, anon, authenticated, service_role;

DO $check_ledger$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'relationship_governance_idempotency'
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND c.relowner = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres')
  ) THEN
    RAISE EXCEPTION 'Relationship idempotency ledger security configuration is invalid';
  END IF;
  IF pg_catalog.has_table_privilege('anon', 'public.relationship_governance_idempotency', 'SELECT')
     OR pg_catalog.has_table_privilege('authenticated', 'public.relationship_governance_idempotency', 'SELECT')
     OR pg_catalog.has_table_privilege(
       'service_role', 'public.relationship_governance_idempotency',
       'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
     )
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.pg_class AS c
       JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
       CROSS JOIN LATERAL pg_catalog.aclexplode(
         COALESCE(c.relacl, pg_catalog.acldefault('r', c.relowner))
       ) AS acl
       WHERE n.nspname = 'public'
         AND c.relname = 'relationship_governance_idempotency'
         AND acl.grantee <> c.relowner
     ) THEN
    RAISE EXCEPTION 'Relationship idempotency ledger must not be directly readable';
  END IF;
END;
$check_ledger$;

COMMIT;
