[
  {
    "table_name": "ad_analytics",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_analytics",
    "column_name": "ad_placement_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_analytics",
    "column_name": "post_id",
    "data_type": "bigint"
  },
  {
    "table_name": "ad_analytics",
    "column_name": "impressions",
    "data_type": "integer"
  },
  {
    "table_name": "ad_analytics",
    "column_name": "clicks",
    "data_type": "integer"
  },
  {
    "table_name": "ad_analytics",
    "column_name": "estimated_revenue",
    "data_type": "numeric"
  },
  {
    "table_name": "ad_analytics",
    "column_name": "date",
    "data_type": "date"
  },
  {
    "table_name": "ad_analytics",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "advertiser_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "city_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "name",
    "data_type": "text"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "status",
    "data_type": "text"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "budget_cents",
    "data_type": "integer"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "spent_cents",
    "data_type": "integer"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "start_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "end_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_campaigns",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_clicks",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_clicks",
    "column_name": "creative_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_clicks",
    "column_name": "placement_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_clicks",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_clicks",
    "column_name": "occurred_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "campaign_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "media_asset_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "headline",
    "data_type": "text"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "body",
    "data_type": "text"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "call_to_action",
    "data_type": "text"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "destination_url",
    "data_type": "text"
  },
  {
    "table_name": "ad_creatives",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_impressions",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_impressions",
    "column_name": "creative_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_impressions",
    "column_name": "placement_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_impressions",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_impressions",
    "column_name": "occurred_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_placements",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_placements",
    "column_name": "ad_slot_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_placements",
    "column_name": "ad_script",
    "data_type": "text"
  },
  {
    "table_name": "ad_placements",
    "column_name": "start_date",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_placements",
    "column_name": "end_date",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_placements",
    "column_name": "enabled",
    "data_type": "boolean"
  },
  {
    "table_name": "ad_placements",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_placements",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ad_placements",
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_placements",
    "column_name": "ad_type",
    "data_type": "text"
  },
  {
    "table_name": "ad_placements",
    "column_name": "link_url",
    "data_type": "text"
  },
  {
    "table_name": "ad_placements",
    "column_name": "city_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_placements",
    "column_name": "placement_name",
    "data_type": "text"
  },
  {
    "table_name": "ad_placements",
    "column_name": "description",
    "data_type": "text"
  },
  {
    "table_name": "ad_placements",
    "column_name": "max_ads",
    "data_type": "integer"
  },
  {
    "table_name": "ad_placements",
    "column_name": "campaign_id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_slots",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ad_slots",
    "column_name": "name",
    "data_type": "text"
  },
  {
    "table_name": "ad_slots",
    "column_name": "position",
    "data_type": "text"
  },
  {
    "table_name": "ad_slots",
    "column_name": "width",
    "data_type": "integer"
  },
  {
    "table_name": "ad_slots",
    "column_name": "height",
    "data_type": "integer"
  },
  {
    "table_name": "ad_slots",
    "column_name": "description",
    "data_type": "text"
  },
  {
    "table_name": "ad_slots",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "admin_id",
    "data_type": "uuid"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "target_type",
    "data_type": "text"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "target_id",
    "data_type": "text"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "action",
    "data_type": "text"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "metadata",
    "data_type": "jsonb"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "admin_override_logs",
    "column_name": "city_id",
    "data_type": "uuid"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "display_name",
    "data_type": "text"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "total_score",
    "data_type": "integer"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "games_played",
    "data_type": "integer"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "has_email",
    "data_type": "boolean"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "total_games",
    "data_type": "bigint"
  },
  {
    "table_name": "admin_user_dashboard",
    "column_name": "last_game_played",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "admin_users",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "admin_users",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "admin_users",
    "column_name": "email",
    "data_type": "text"
  },
  {
    "table_name": "admin_users",
    "column_name": "role",
    "data_type": "text"
  },
  {
    "table_name": "admin_users",
    "column_name": "city_ids",
    "data_type": "ARRAY"
  },
  {
    "table_name": "admin_users",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "admin_users",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "admin_users",
    "column_name": "primary_city_slug",
    "data_type": "text"
  },
  {
    "table_name": "admin_users",
    "column_name": "status",
    "data_type": "text"
  },
  {
    "table_name": "admin_users",
    "column_name": "password_hash",
    "data_type": "text"
  },
  {
    "table_name": "admin_users",
    "column_name": "auth_uid",
    "data_type": "text"
  },
  {
    "table_name": "advertisers",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "advertisers",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "advertisers",
    "column_name": "business_name",
    "data_type": "text"
  },
  {
    "table_name": "advertisers",
    "column_name": "contact_email",
    "data_type": "text"
  },
  {
    "table_name": "advertisers",
    "column_name": "website_url",
    "data_type": "text"
  },
  {
    "table_name": "advertisers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "ai_response_cache",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "ai_response_cache",
    "column_name": "cache_key",
    "data_type": "text"
  },
  {
    "table_name": "ai_response_cache",
    "column_name": "response",
    "data_type": "text"
  },
  {
    "table_name": "ai_response_cache",
    "column_name": "city_name",
    "data_type": "text"
  },
  {
    "table_name": "ai_response_cache",
    "column_name": "user_id",
    "data_type": "text"
  },
  {
    "table_name": "ai_response_cache",
    "column_name": "tokens_used",
    "data_type": "integer"
  }
]