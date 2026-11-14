BEGIN;

-- Assertion-only preflight. Migrations 1-5 already enforce their CHECK, FK,
-- NOT NULL and unique constraints; this migration does not add or change them.
-- Cross-table checks are a point-in-time audit, not continuous enforcement.
DO $validate$
DECLARE
  v_missing text;
  v_count bigint;
BEGIN
  SELECT string_agg(format('%s.%s', e.table_name, e.constraint_name), ', ' ORDER BY e.table_name, e.constraint_name)
  INTO v_missing
  FROM (VALUES
    ('media_assets', 'media_assets_uploaded_by_fkey'),
    ('media_assets', 'media_assets_storage_location_pair_chk'),
    ('media_assets', 'media_assets_storage_fields_nonblank_chk'),
    ('civic_media_attachments', 'civic_media_attachments_city_id_fkey'),
    ('civic_media_attachments', 'civic_media_attachments_media_asset_id_fkey'),
    ('civic_media_attachments', 'civic_media_attachments_created_by_fkey'),
    ('civic_media_attachments', 'civic_media_attachments_object_type_chk'),
    ('civic_media_attachments', 'civic_media_attachments_role_chk'),
    ('civic_media_attachments', 'civic_media_attachments_role_primary_chk'),
    ('civic_media_attachments', 'civic_media_attachments_display_order_chk'),
    ('civic_media_attachments', 'civic_media_attachments_alt_text_chk'),
    ('panoramas', 'panoramas_city_id_fkey'),
    ('panoramas', 'panoramas_created_by_fkey'),
    ('panoramas', 'panoramas_updated_by_fkey'),
    ('panoramas', 'panoramas_published_by_fkey'),
    ('panoramas', 'panoramas_archived_by_fkey'),
    ('panoramas', 'panoramas_object_type_chk'),
    ('panoramas', 'panoramas_status_chk'),
    ('panoramas', 'panoramas_published_at_chk'),
    ('panoramas', 'panoramas_archived_at_chk'),
    ('panoramas', 'panoramas_draft_lifecycle_chk'),
    ('panoramas', 'panoramas_label_length_chk'),
    ('panoramas', 'panoramas_description_length_chk'),
    ('panoramas', 'panoramas_display_order_chk'),
    ('panoramas', 'panoramas_pan_x_initial_chk'),
    ('panoramas', 'panoramas_pan_y_initial_chk'),
    ('panoramas', 'panoramas_metadata_object_chk'),
    ('hotspots', 'hotspots_panorama_id_fkey'),
    ('hotspots', 'hotspots_city_id_fkey'),
    ('hotspots', 'hotspots_created_by_fkey'),
    ('hotspots', 'hotspots_updated_by_fkey'),
    ('hotspots', 'hotspots_pan_x_chk'),
    ('hotspots', 'hotspots_pan_y_chk'),
    ('hotspots', 'hotspots_target_type_chk'),
    ('hotspots', 'hotspots_target_exclusive_chk'),
    ('hotspots', 'hotspots_target_url_https_chk'),
    ('hotspots', 'hotspots_label_length_chk'),
    ('hotspots', 'hotspots_icon_nonblank_chk'),
    ('hotspots', 'hotspots_display_order_chk'),
    ('hotspots', 'hotspots_metadata_object_chk'),
    ('hotspots', 'hotspots_behavior_object_chk'),
    ('city_feature_toggles', 'city_feature_toggles_feature_name_nonblank_chk')
  ) AS e(table_name, constraint_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS c
    JOIN pg_catalog.pg_class AS t ON t.oid = c.conrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = e.table_name
      AND c.conname = e.constraint_name AND c.convalidated
  );
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing or unvalidated media constraints: %', v_missing;
  END IF;

  SELECT string_agg(format('%s.%s', e.table_name, e.column_name), ', ' ORDER BY e.table_name, e.column_name)
  INTO v_missing
  FROM (VALUES
    ('civic_media_attachments', 'city_id'),
    ('civic_media_attachments', 'civic_object_id'),
    ('civic_media_attachments', 'civic_object_type'),
    ('civic_media_attachments', 'media_asset_id'),
    ('civic_media_attachments', 'role'),
    ('civic_media_attachments', 'is_primary'),
    ('civic_media_attachments', 'display_order'),
    ('civic_media_attachments', 'is_decorative'),
    ('civic_media_attachments', 'created_at'),
    ('panoramas', 'label'),
    ('panoramas', 'display_order'),
    ('panoramas', 'pan_x_initial'),
    ('panoramas', 'pan_y_initial'),
    ('panoramas', 'metadata'),
    ('hotspots', 'target_type'),
    ('hotspots', 'label'),
    ('hotspots', 'icon'),
    ('hotspots', 'is_active'),
    ('hotspots', 'display_order'),
    ('hotspots', 'metadata'),
    ('hotspots', 'behavior'),
    ('city_feature_toggles', 'enabled')
  ) AS e(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute AS a
    JOIN pg_catalog.pg_class AS t ON t.oid = a.attrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = e.table_name
      AND a.attname = e.column_name AND a.attnotnull AND NOT a.attisdropped
  );
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing media NOT NULL requirements: %', v_missing;
  END IF;

  SELECT string_agg(e.index_name, ', ' ORDER BY e.index_name)
  INTO v_missing
  FROM (VALUES
    ('media_assets', 'media_assets_storage_location_uidx'),
    ('civic_media_attachments', 'civic_media_attachments_primary_role_uidx')
  ) AS e(table_name, index_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS i
    JOIN pg_catalog.pg_class AS idx ON idx.oid = i.indexrelid
    JOIN pg_catalog.pg_class AS t ON t.oid = i.indrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = e.table_name
      AND idx.relname = e.index_name AND i.indisunique AND i.indisvalid AND i.indisready
  );
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing or invalid media unique indexes: %', v_missing;
  END IF;

  SELECT string_agg(format('%s.%s', e.table_name, e.trigger_name), ', ' ORDER BY e.table_name, e.trigger_name)
  INTO v_missing
  FROM (VALUES
    ('civic_media_attachments', 'trg_civic_media_attachments_validate'),
    ('panoramas', 'trg_panoramas_enforce_lifecycle'),
    ('panoramas', 'trg_panoramas_deactivate_hotspots_on_archive'),
    ('hotspots', 'trg_hotspots_enforce_integrity'),
    ('civic_entities', 'trg_civic_entities_require_published_panorama'),
    ('civic_events', 'trg_civic_events_require_published_panorama'),
    ('civic_places', 'trg_civic_places_require_published_panorama'),
    ('civic_moments', 'trg_civic_moments_require_published_panorama'),
    ('civic_artifacts', 'trg_civic_artifacts_require_published_panorama'),
    ('civic_neighborhoods', 'trg_civic_neighborhoods_require_published_panorama'),
    ('civic_stories', 'trg_civic_stories_require_published_panorama')
  ) AS e(table_name, trigger_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS tr
    JOIN pg_catalog.pg_class AS t ON t.oid = tr.tgrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = e.table_name
      AND tr.tgname = e.trigger_name AND NOT tr.tgisinternal AND tr.tgenabled IN ('O', 'A')
  );
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing or disabled media integrity triggers: %', v_missing;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.civic_media_attachments AS a
  JOIN public.media_assets AS m ON m.id = a.media_asset_id
  WHERE public.civic_object_city_id(a.civic_object_type, a.civic_object_id) IS DISTINCT FROM a.city_id
     OR (m.storage_bucket IS NOT NULL AND m.storage_bucket <> 'universal-media');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Media attachments with missing/wrong-city owners or unsupported recorded buckets: %', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.panoramas AS p
  WHERE public.civic_object_city_id(p.civic_object_type, p.civic_object_id) IS DISTINCT FROM p.city_id;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Panoramas with missing or wrong-city owners: %', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.hotspots AS h
  JOIN public.panoramas AS p ON p.id = h.panorama_id
  WHERE h.city_id IS DISTINCT FROM p.city_id
     OR h.status IS DISTINCT FROM CASE WHEN h.is_active THEN 'active' ELSE 'inactive' END
     OR (p.status = 'archived' AND h.is_active)
     OR (h.target_type = 'panorama' AND
         (SELECT target.city_id FROM public.panoramas AS target WHERE target.id = h.target_id)
           IS DISTINCT FROM h.city_id)
     OR (h.target_type NOT IN ('panorama', 'external_url') AND
         public.civic_object_city_id(h.target_type, h.target_id) IS DISTINCT FROM h.city_id);
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Hotspots with inconsistent parent, target, or legacy status: %', v_count;
  END IF;
END
$validate$;

-- Do not assert continuous target publication or a published parent for an
-- active hotspot: target eligibility is checked at activation and active flags
-- persist when a panorama returns to draft. Do not validate legacy URL fields.
COMMIT;
