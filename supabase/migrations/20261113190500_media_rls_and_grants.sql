BEGIN;

-- Authorization helpers. SECURITY DEFINER so policies never need the caller to
-- read admin_users. Identity: admin_users.user_id = auth.uid(), active only.
-- CEO and PLATFORM_ADMIN are global; CITY_ADMIN is scoped to city_ids.
-- Null or empty city_ids grants no city access.
CREATE OR REPLACE FUNCTION public.media_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT a.role
  FROM public.admin_users AS a
  WHERE a.user_id = auth.uid()
    AND a.status = 'active'
    AND a.role IN ('CEO', 'PLATFORM_ADMIN', 'CITY_ADMIN')
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.media_admin_can_access_city(p_city_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT COALESCE((
    SELECT a.role IN ('CEO', 'PLATFORM_ADMIN')
        OR (
          a.role = 'CITY_ADMIN'
          AND p_city_id IS NOT NULL
          AND p_city_id::text = ANY (COALESCE(a.city_ids::text[], ARRAY[]::text[]))
        )
    FROM public.admin_users AS a
    WHERE a.user_id = auth.uid()
      AND a.status = 'active'
      AND a.role IN ('CEO', 'PLATFORM_ADMIN', 'CITY_ADMIN')
    LIMIT 1
  ), false)
$function$;

-- True when an asset is attached to at least one published civic object.
CREATE OR REPLACE FUNCTION public.media_asset_is_public(p_asset_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.civic_media_attachments AS a
    WHERE a.media_asset_id = p_asset_id
      AND public.civic_object_is_published(a.civic_object_type, a.civic_object_id)
  )
$function$;

REVOKE ALL ON FUNCTION public.media_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.media_admin_can_access_city(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.media_asset_is_public(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.civic_object_is_published(text, uuid) FROM PUBLIC, anon, authenticated;

-- Policies run with the caller's EXECUTE rights, so grant only what each role's
-- policies call. anon never calls an admin helper.
GRANT EXECUTE ON FUNCTION public.media_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.media_admin_can_access_city(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.media_asset_is_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.civic_object_is_published(text, uuid) TO anon, authenticated;

-- Remove broad grants (including TRUNCATE) from client roles.
REVOKE ALL ON public.panoramas               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.hotspots                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.media_assets            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.city_feature_toggles    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.civic_media_attachments FROM PUBLIC, anon, authenticated;

-- Read-only, column-limited. Actor columns, metadata and legacy columns stay hidden;
-- admin screens read them through service-role routes.
GRANT SELECT (
  id, city_id, civic_object_id, civic_object_type, equirectangular_url, thumbnail_url,
  label, description, display_order, status, is_published, pan_x_initial, pan_y_initial,
  capture_date, capture_attribution, published_at, created_at, updated_at
) ON public.panoramas TO anon, authenticated;

GRANT SELECT (
  id, city_id, panorama_id, pan_x, pan_y, label, icon, target_type, target_id,
  target_url, is_active, display_order, created_at, updated_at
) ON public.hotspots TO anon, authenticated;

GRANT SELECT (
  id, city_id, civic_object_id, civic_object_type, media_asset_id, role, is_primary,
  display_order, alt_text, caption, is_decorative, created_at
) ON public.civic_media_attachments TO anon, authenticated;

GRANT SELECT (
  id, url, alt_text, type, mime_type, source, source_url, attribution, license,
  created_at, updated_at
) ON public.media_assets TO anon, authenticated;

GRANT SELECT (id, city_id, feature_name, enabled, created_at, updated_at)
  ON public.city_feature_toggles TO authenticated;

ALTER TABLE public.panoramas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_feature_toggles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_media_attachments ENABLE ROW LEVEL SECURITY;

-- Replace legacy policies. Both *_city_admin_all policies read admin_users and
-- were not city-scoped; the toggle policy compared the JWT role claim.
DROP POLICY IF EXISTS panoramas_anon_select    ON public.panoramas;
DROP POLICY IF EXISTS panoramas_city_admin_all ON public.panoramas;
DROP POLICY IF EXISTS hotspots_anon_select     ON public.hotspots;
DROP POLICY IF EXISTS hotspots_city_admin_all  ON public.hotspots;
DROP POLICY IF EXISTS "CEO and platform_admin can manage city feature toggles"
  ON public.city_feature_toggles;
DROP POLICY IF EXISTS panoramas_public_read ON public.panoramas;
DROP POLICY IF EXISTS panoramas_admin_read  ON public.panoramas;
DROP POLICY IF EXISTS hotspots_public_read  ON public.hotspots;
DROP POLICY IF EXISTS hotspots_admin_read   ON public.hotspots;
DROP POLICY IF EXISTS civic_media_attachments_public_read ON public.civic_media_attachments;
DROP POLICY IF EXISTS civic_media_attachments_admin_read  ON public.civic_media_attachments;
DROP POLICY IF EXISTS media_assets_public_read ON public.media_assets;
DROP POLICY IF EXISTS media_assets_admin_read  ON public.media_assets;
DROP POLICY IF EXISTS city_feature_toggles_admin_read ON public.city_feature_toggles;

-- Panoramas
CREATE POLICY panoramas_public_read ON public.panoramas
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY panoramas_admin_read ON public.panoramas
  FOR SELECT TO authenticated
  USING (public.media_admin_can_access_city(city_id));

-- Hotspots: active hotspots on published panoramas only.
CREATE POLICY hotspots_public_read ON public.hotspots
  FOR SELECT TO anon, authenticated
  USING (
    is_active
    AND EXISTS (
      SELECT 1 FROM public.panoramas AS p
      WHERE p.id = hotspots.panorama_id
        AND p.status = 'published'
    )
  );

CREATE POLICY hotspots_admin_read ON public.hotspots
  FOR SELECT TO authenticated
  USING (public.media_admin_can_access_city(city_id));

-- Attachments: visible when the owning civic object is published.
CREATE POLICY civic_media_attachments_public_read ON public.civic_media_attachments
  FOR SELECT TO anon, authenticated
  USING (public.civic_object_is_published(civic_object_type, civic_object_id));

CREATE POLICY civic_media_attachments_admin_read ON public.civic_media_attachments
  FOR SELECT TO authenticated
  USING (public.media_admin_can_access_city(city_id));

-- Media registry: public only for assets attached to published objects.
-- Any active admin may read the shared registry. The existing
-- service_role_full_access policy is untouched.
CREATE POLICY media_assets_public_read ON public.media_assets
  FOR SELECT TO anon, authenticated
  USING (public.media_asset_is_public(id));

CREATE POLICY media_assets_admin_read ON public.media_assets
  FOR SELECT TO authenticated
  USING (public.media_admin_role() IS NOT NULL);

-- Feature toggles: read-only for admins within their city scope.
CREATE POLICY city_feature_toggles_admin_read ON public.city_feature_toggles
  FOR SELECT TO authenticated
  USING (public.media_admin_can_access_city(city_id));

COMMIT;
