BEGIN;

CREATE FUNCTION public.osm_operations_for_city(p_actor_admin_id uuid, p_actor_auth_uid uuid, p_city_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
BEGIN
  PERFORM public.civic_authorize_lifecycle_mutation(p_actor_admin_id, p_actor_auth_uid, p_city_id, 'create_pending');
  RETURN pg_catalog.jsonb_build_object(
    'boundaries', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', b.id, 'city_id', b.city_id, 'source_url', b.source_url, 'source_version', b.source_version,
      'geometry', b.geometry, 'registered_at', b.registered_at, 'registered_by', a.email
    ) ORDER BY b.registered_at DESC, b.id DESC)
      FROM public.osm_city_boundaries b LEFT JOIN public.admin_users a ON a.id = b.registered_by
      WHERE b.city_id = p_city_id), '[]'::jsonb),
    'batches', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', b.id, 'boundary_id', b.boundary_id, 'source', b.source_name,
      'source_version', b.source_version, 'started_at', b.started_at, 'status', b.status, 'error', b.error,
      'audit_id', (SELECT l.id FROM public.admin_action_logs l WHERE l.entity_type = 'osm_ingestion_batch'
        AND l.entity_id = b.id ORDER BY l.created_at DESC LIMIT 1),
      'items', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'external_id', i.external_id, 'state', i.processed_state, 'disposition', i.disposition,
        'audit_id', i.audit_id, 'place_id', i.place_id, 'name', p.name, 'slug', p.slug,
        'category', p.place_type, 'place_status', p.status, 'is_published', p.is_published
      ) ORDER BY i.created_at, i.id) FROM public.osm_ingestion_items i
        LEFT JOIN public.civic_places p ON p.id = i.place_id WHERE i.batch_id = b.id), '[]'::jsonb)
    ) ORDER BY b.started_at DESC, b.id DESC) FROM public.osm_ingestion_batches b
      WHERE b.city_id = p_city_id), '[]'::jsonb)
  );
END;
$function$;

ALTER FUNCTION public.osm_operations_for_city(uuid, uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.osm_operations_for_city(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.osm_operations_for_city(uuid, uuid, uuid) TO service_role;

COMMIT;