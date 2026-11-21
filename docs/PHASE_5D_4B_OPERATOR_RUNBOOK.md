# Phase 5D-4B — OSM Place Operator Runbook

This runbook covers the ingestion UI workflow for preparing/registering a
city boundary and running a small OSM Place import. Use an active, signed-in
administrator with one of these roles:
City Admin assigned to the target city, CEO, or Platform Admin with city
access.

The ingestion request processes synchronously. A successful response means
the run has finished; it does not mean every returned OSM object became a new
Place. Review the counts and batch details before proceeding.

## Seattle boundary source recommendation

Use the City of Seattle GIS **Seattle City Limits** dataset as the boundary
source to evaluate for this first Seattle test:

- [Seattle City Limits — Seattle GIS Open Data](https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::seattle-city-limits-2)
- [Seattle City Limits — Seattle Open Data catalog](https://data.seattle.gov/dataset/Seattle-City-Limits/skbv-gsrb)

The Seattle GIS dataset describes the municipal boundary and offers a GeoJSON
download. Before registering it, confirm that the dataset's current geometry
and licensing/terms are appropriate for the intended use. The operator must
record the actual dataset version/update metadata shown by the portal; if none
is provided, record the retrieval date as the version and retain the download
with the acceptance evidence.

The endpoint accepts a **GeoJSON `Polygon` or `MultiPolygon` geometry object**,
not a `Feature` or `FeatureCollection`. If the download is a FeatureCollection,
extract the appropriate feature's `geometry`. If the boundary is multipart,
use a valid, non-overlapping `MultiPolygon`. Keep the registered geometry
within the endpoint's 5,000-coordinate validation limit. Do not simplify or
modify the authoritative geometry without recording that transformation and
its approval.

The registration source URL should be the HTTPS dataset page above. The
`source_version` should identify the specific dataset release/update used,
not the OSM data snapshot (that snapshot is captured separately when a run
starts).

## Before you start

Have these values ready:

1. The Seattle `city_id` UUID from the admin system.
2. The administrator's active, authenticated application session.
3. The authoritative boundary's full `Polygon` or `MultiPolygon` geometry.
4. The boundary source URL and recorded source version.
5. A small query box whose numeric bounds fit inside the registered
   boundary's bounding extent.

If the source exceeds the registration parser's 5,000-coordinate cap, use
**Prepare Boundary** from Admin → Ingestion → Boundary Registry. The preparation
view retains the original geometry, generates a projected simplification
candidate, and compares containment before approval. Review the overlay and
explicitly acknowledge any boundary-near differences; interior/exterior grid
differences block approval. Registration remains subject to the existing parser
and 1 MiB request-body cap. See the [boundary preparation notes](./AI_INGESTION.md#boundary-preparation-for-large-municipal-geometry)
for the measured Oakland result and comparison details.

The boundary must pass geometry validation: coordinates are longitude,
latitude pairs; rings are closed and valid; geometry is not self-intersecting;
and antimeridian-crossing rings are not supported. Each candidate is checked
against the polygon itself. A point outside the polygon, on its boundary, in a
hole, or missing coordinates is quarantined.

## Boundary registration runbook

1. Sign in to the admin application as an authorized administrator.
2. Download the boundary from Seattle's GIS portal and extract the correct
   GeoJSON geometry object. Confirm its source/version and retain the source
   evidence.
3. Send the registration request shown below to
   `POST /api/admin/ingestion/osm/boundaries`.
4. Save the returned `boundary_id` and `audit_id`; use that `boundary_id` for
   the run. Boundary versions are immutable.
5. If the registration response says the outcome is unconfirmed, **do not
   submit again immediately**. Reconcile the boundary-registration audit
   (`ingestion_boundary_registered`) first. There is no boundary-list API.

### Postman request

- Method: `POST`
- URL: `{{app_origin}}/api/admin/ingestion/osm/boundaries`
- Headers: `Content-Type: application/json`
- Authentication: use the signed-in admin's application session cookies. The
  request does not accept administrator IDs in its JSON body.
- Body: **raw / JSON**

```json
{
  "city_id": "{{seattle_city_id}}",
  "source_url": "https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::seattle-city-limits-2",
  "source_version": "{{actual_portal_version_or_retrieval_date}}",
  "geometry": {{seattle_geometry}}
}
```

Define `seattle_geometry` in the Postman environment as the complete,
JSON-serialized GeoJSON geometry object (without surrounding quotes). Confirm
the substituted request body is valid JSON before sending. `Polygon` is also
accepted. `source_version` must be a non-empty string of at most 200
characters.

### cURL request

Save a request body containing the same fields as `seattle-boundary.json`,
including the full geometry. `COOKIE_JAR` must be a securely obtained cookie
jar for the signed-in admin session; do not share or commit it.

```sh
export APP_ORIGIN="https://<admin-application-host>"
export COOKIE_JAR="<path-to-secure-admin-cookie-jar>"

curl --silent --show-error --include \
  --cookie "$COOKIE_JAR" \
  --header "Content-Type: application/json" \
  --data-binary "@seattle-boundary.json" \
  "$APP_ORIGIN/api/admin/ingestion/osm/boundaries"
```

## Run execution examples

### Plan a five-object test

The run API has **no exact-five parameter, preview, or dry-run**. It queries
Overpass for the box and processes all returned source elements, up to 50.
Duplicates and quarantines mean the number of created Places may be lower
than the number of source elements. Choose a small box expected to return five
or fewer relevant source elements and check the returned batch details; do
not assume it guarantees exactly five created Places.

The query box must be valid and inside the registered boundary's bounding
extent:

- `south` and `north`: finite latitude numbers with `south < north`
- `west` and `east`: finite longitude numbers with `west < east`
- Latitude range: -90 through 90; longitude range: -180 through 180

The following central Seattle box is illustrative only. Confirm it fits the
registered boundary extent and is appropriately small before sending. The
operator should adjust the values based on the verified boundary and desired
test area.

### Postman run request

- Method: `POST`
- URL: `{{app_origin}}/api/admin/ingestion/osm/runs`
- Headers: `Content-Type: application/json`
- Authentication: same signed-in admin session as the boundary request
- Body: **raw / JSON**

```json
{
  "city_id": "{{seattle_city_id}}",
  "boundary_id": "{{boundary_id_from_registration}}",
  "source": "openstreetmap",
  "query_box": {
    "south": 47.60,
    "west": -122.35,
    "north": 47.61,
    "east": -122.34
  }
}
```

### cURL run request

```sh
curl --silent --show-error --include \
  --cookie "$COOKIE_JAR" \
  --header "Content-Type: application/json" \
  --data '{
    "city_id": "<Seattle city UUID>",
    "boundary_id": "<boundary UUID returned by registration>",
    "source": "openstreetmap",
    "query_box": {
      "south": 47.60,
      "west": -122.35,
      "north": 47.61,
      "east": -122.34
    }
  }' \
  "$APP_ORIGIN/api/admin/ingestion/osm/runs"
```

Substitute the real IDs and verified query box. The run contacts Overpass,
records its `timestamp_osm_base` as the source version, stages raw records,
and creates governed pending Places or records duplicate/quarantine
dispositions. The maximum is 50 source results. More than 50 causes the run
to fail before item staging; split the area and start a new run after
reviewing the failed batch.

## Expected success responses

### Boundary registration — HTTP 200

```json
{
  "result": {
    "boundary_id": "<UUID>",
    "city_id": "<Seattle city UUID>",
    "audit_id": "<UUID>"
  }
}
```

Save both IDs. There is no route to list registered boundaries.

### Completed run — HTTP 200

```json
{
  "batch_id": "<UUID>",
  "counts": {
    "created": 5,
    "duplicate": 0,
    "quarantined": 0
  },
  "audit_id": "<UUID>"
}
```

The counts above illustrate a possible result; they are not guaranteed. Every
created Place should be `pending`, unpublished, and associated with Seattle.

Fetch the run details by its returned ID:

```sh
curl --silent --show-error --include \
  --cookie "$COOKIE_JAR" \
  "$APP_ORIGIN/api/admin/ingestion/osm/runs?batch_id=<batch-UUID>"
```

The response is `{ "result": { ... } }`, containing batch metadata and an
`items` array with each item's `raw_id`, `external_id`, `source_hash`, `state`,
`disposition`, `place_id`, and `audit_id`. Raw payloads are not included.
Confirm the batch status and reconcile the items/counts before treating the
test as complete.

## Expected failure responses

Error responses have this shape:

```json
{ "error": "<message>" }
```

### Boundary registration

| HTTP | Example response | Meaning / operator action |
| --- | --- | --- |
| 400 | `{"error":"Invalid JSON"}` | Send valid JSON. |
| 400 | `{"error":"City, source URL, source version, and geometry are required"}` | Check required fields, UUID, and non-empty version. |
| 400 | `{"error":"Invalid boundary source URL"}` | Correct the URL. |
| 400 | `{"error":"Boundary source must be an HTTPS URL without credentials"}` | Use HTTPS and remove URL credentials. |
| 400 | `{"error":"Boundary must be a GeoJSON Polygon or MultiPolygon"}` or another geometry validation message | Supply a valid geometry object; review rings, coordinates, and geometry validity. |
| 401 | `{"error":"Unauthorized"}` | Sign in with an active admin account. |
| 403 | `{"error":"Forbidden"}` | Use an allowed role with access to Seattle. |
| 413 | `{"error":"Boundary exceeds the size limit"}` | Request body exceeds 1 MiB; use an appropriately sized validated boundary. |
| 502 | `{"error":"Registration outcome is unconfirmed; verify before retrying"}` | Reconcile the registration audit before retrying; no boundary-list endpoint exists. |

### Starting a run

| HTTP | Example response | Meaning / operator action |
| --- | --- | --- |
| 400 | `{"error":"City, boundary, and OpenStreetMap source are required"}` | Check UUIDs and `source: "openstreetmap"`. |
| 400 | `{"error":"A valid query_box is required"}` | Check numeric finite bounds, ranges, and south/north and west/east order. |
| 401 / 403 | `{"error":"Unauthorized"}` / `{"error":"Forbidden"}` | Sign in as an active allowed admin with Seattle access. |
| 502 | `{"error":"Batch start outcome is unconfirmed; verify before retrying","batch_id":"<UUID>"}` | Look up this exact batch ID before any retry. |
| 502 | `{"error":"<failure reason>","batch_id":"<UUID>","counts":{"created":0,"duplicate":0,"quarantined":0}}` | The batch failed after it started. Inspect the batch before taking action. |
| 502 | `{"error":"Batch outcome is unconfirmed; verify before retrying","batch_id":"<UUID>","counts":{...}}` | Query the batch by ID; do not blindly repeat the run. |

Run failure reasons can include a query box outside the registered boundary
extent, an Overpass error/incomplete response, missing or invalid source
version, more than 50 results, invalid or duplicate source identity, or a
staging/processing failure. Some failures can occur after items have been
processed, so a failed run may have partial state. Use the batch lookup to
inspect it. If a batch remains running after an interrupted request, an
authorized admin can abort it:

```sh
curl --silent --show-error --include \
  --cookie "$COOKIE_JAR" \
  --request PATCH \
  --header "Content-Type: application/json" \
  --data '{
    "batch_id": "<batch UUID>",
    "operation": "abort",
    "reason": "Operator-approved explanation for abort"
  }' \
  "$APP_ORIGIN/api/admin/ingestion/osm/runs"
```

Do not retry with a new batch until you have reconciled the previous batch and
its item dispositions. A retry is a new ingestion run, not a way to resume an
uncertain request.

## Operator completion checklist

- [ ] Seattle boundary source, version, attribution/rights, boundary ID, and
      registration audit ID recorded.
- [ ] Query box checked against boundary extent and kept small.
- [ ] Batch ID, source snapshot version, result counts, and finish audit ID
      recorded.
- [ ] Batch lookup confirms final status and item dispositions.
- [ ] Created Places are Seattle-scoped, `pending`, unpublished, and
      provenance-linked.
- [ ] No approval, publication, panorama, or hotspot action was performed as
      part of ingestion itself.

For approval, review, panorama, and hotspot acceptance, continue with the
[Phase 5D-4B acceptance report](./PHASE_5D_4B_ACCEPTANCE_REPORT.md).
