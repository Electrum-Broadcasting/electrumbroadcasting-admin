const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const city = "11111111-1111-4111-8111-111111111111";
const actor = "22222222-2222-4222-8222-222222222222";
const user = "33333333-3333-4333-8333-333333333333";
const boundaryId = "44444444-4444-4444-8444-444444444444";
const audit = "66666666-6666-4666-8666-666666666666";
const raw = "77777777-7777-4777-8777-777777777777";
const geometry = { type: "Polygon", coordinates: [
  [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
  [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
] };

function load(file, mocks = {}) {
  const filename = path.join(root, file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
  mod._compile(source, filename);
  return mod.exports;
}

function fixture() {
  const state = { calls: [], role: "CITY_ADMIN", cities: [city], items: [], throwOn: null };
  const service = { async rpc(name, args) {
    state.calls.push({ name, args });
    if (name === state.throwOn) throw new Error("transport failure");
    if (name === "osm_start_batch") return { data: { batch_id: args.p_batch_id, audit_id: audit, geometry }, error: null, status: 200 };
    if (name === "osm_set_source_version") return { data: { batch_id: args.p_batch_id, audit_id: audit, source_version: args.p_source_version }, error: null, status: 200 };
    if (name === "osm_stage_item") return { data: { raw_id: raw, audit_id: audit, state: "staged" }, error: null, status: 200 };
    if (name === "osm_ingest_item") return { data: { raw_id: raw, audit_id: audit, state: args.p_quarantine_reason ? "quarantined" : "created" }, error: null, status: 200 };
    if (name === "osm_finish_batch") return { data: { batch_id: args.p_batch_id, audit_id: audit, status: args.p_error ? "failed" : "completed" }, error: null, status: 200 };
    throw new Error(`Unexpected RPC ${name}`);
  } };
  const mocks = {
    "@supabase/supabase-js": { createClient: () => service },
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    "@/lib/admin/context": { resolveAdminContext: async () => ({ ok: true, admin: { id: actor, auth_uid: user, role: state.role, city_ids: state.cities } }) },
    "@/lib/admin/guards": { isValidCityId: (value) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value) },
    "@/lib/admin/permissions": { canAccessCity: (admin, id) => admin.city_ids.includes(id) },
    "@/lib/ingestion/cityBoundary": load("lib/ingestion/cityBoundary.ts"),
    "@/lib/supabase/env": { SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
    "@/supabase/functions/ingest_osm_places/overpassQuery": load("supabase/functions/ingest_osm_places/overpassQuery.ts"),
  };
  return { state, runs: load("app/api/admin/ingestion/osm/runs/route.ts", mocks),
    boundaries: load("app/api/admin/ingestion/osm/boundaries/route.ts", mocks) };
}

const runInput = { city_id: city, boundary_id: boundaryId, source: "openstreetmap",
  query_box: { south: 0, west: 0, north: 10, east: 10 } };
const request = (body) => new Request("http://local", { method: "POST", body: JSON.stringify(body) });

test("authenticated run stages every item then creates or quarantines with a source snapshot", async () => {
  const { state, runs } = fixture();
  const original = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({
    osm3s: { timestamp_osm_base: "2026-11-19T21:00:00Z" },
    elements: [{ type: "node", id: 1, lat: 1, lon: 1, tags: { name: "Library", amenity: "library" } },
      { type: "way", id: 2, center: { lat: 5, lon: 5 }, tags: { name: "Inside hole" } }],
  }));
  try {
    const result = await runs.POST(request(runInput));
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.counts, { created: 1, duplicate: 0, quarantined: 1 });
    assert.deepEqual(state.calls.map((call) => call.name),
      ["osm_start_batch", "osm_set_source_version", "osm_stage_item", "osm_stage_item", "osm_ingest_item", "osm_ingest_item", "osm_finish_batch"]);
    assert.equal(state.calls[4].args.p_candidate.name, "Library");
    assert.equal(state.calls[5].args.p_quarantine_reason, "location_outside");
    assert.equal(state.calls[4].args.p_actor_auth_uid, user);
  } finally { global.fetch = original; }
});

test("unconfirmed batch start reports the preassigned ID for reconciliation", async () => {
  const { state, runs } = fixture();
  state.throwOn = "osm_start_batch";
  const result = await runs.POST(request(runInput));
  assert.equal(result.status, 502);
  assert.equal(result.body.batch_id, state.calls[0].args.p_batch_id);
  assert.equal(state.calls.length, 1);
});

test("cross-city requests and missing boundaries are rejected before starting a batch", async () => {
  const { state, runs } = fixture();
  state.cities = [];
  assert.equal((await runs.POST(request(runInput))).status, 403);
  assert.equal(state.calls.length, 0);
  assert.equal((await runs.POST(request({ ...runInput, boundary_id: null }))).status, 400);
});

test("truncated source results fail the batch without staging a subset", async () => {
  const { state, runs } = fixture();
  const original = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ osm3s: { timestamp_osm_base: "2026-11-19T21:00:00Z" },
    elements: Array.from({ length: 51 }, (_, id) => ({ type: "node", id: id + 1 })) }));
  try {
    const result = await runs.POST(request(runInput));
    assert.equal(result.status, 502);
    assert.match(result.body.error, /smaller query box/);
    assert.equal(state.calls.some((call) => call.name === "osm_stage_item"), false);
    assert.match(state.calls.at(-1).args.p_error, /50 results/);
  } finally { global.fetch = original; }
});

test("boundary registration rejects invalid geometry and out-of-city actors", async () => {
  const { state, boundaries } = fixture();
  const data = { city_id: city, source_url: "https://example.test/boundary", source_version: "v1",
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]] } };
  assert.equal((await boundaries.POST(request(data))).status, 400);
  state.cities = [];
  assert.equal((await boundaries.POST(request({ ...data, geometry }))).status, 403);
  assert.equal(state.calls.length, 0);
});
