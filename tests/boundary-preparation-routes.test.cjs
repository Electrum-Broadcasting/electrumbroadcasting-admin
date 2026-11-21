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
const preparationId = "44444444-4444-4444-8444-444444444444";
const boundaryId = "55555555-5555-4555-8555-555555555555";
const geometry = { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] };
const candidate = { geometry, metadata: { algorithm: "Douglas-Peucker", prepared_coordinates: 5,
  prepared_size_bytes: 90, reduction_percent: 0, validation_passed: true,
  containment: { grid_differences: 0, boundary_differences: 0 } } };

function load(file, mocks = {}) {
  const filename = path.join(root, file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
  mod._compile(source, filename);
  return mod.exports;
}

function fixture() {
  const state = { calls: [], role: "CITY_ADMIN", cities: [city], preparation: {
    id: preparationId, city_id: city, source_url: "https://example.test/oakland", source_version: "v1",
    source_geometry: geometry, source_hash: "a".repeat(64), status: "uploaded",
  } };
  const service = { async rpc(name, args) {
    state.calls.push({ name, args });
    if (name === "osm_create_boundary_preparation") return { data: { preparation_id: preparationId }, error: null };
    if (name === "osm_list_boundary_preparations") return { data: [], error: null };
    if (name === "osm_get_boundary_preparation") return { data: state.preparation, error: null };
    if (name === "osm_save_boundary_preparation_candidate") return { data: { preparation_id: preparationId, candidate_id: boundaryId, candidate_version: 1 }, error: null };
    if (name === "osm_approve_boundary_preparation") return { data: { preparation_id: preparationId }, error: null };
    if (name === "osm_reject_boundary_preparation") return { data: { preparation_id: preparationId }, error: null };
    if (name === "osm_register_prepared_boundary") return { data: { preparation_id: preparationId, boundary_id: boundaryId }, error: null };
    throw new Error(`Unexpected RPC ${name}`);
  } };
  const mocks = {
    "@supabase/supabase-js": { createClient: () => service },
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    "@/lib/admin/context": { resolveAdminContext: async () => ({ ok: true, admin: { id: actor, auth_uid: user, role: state.role, city_ids: state.cities } }) },
    "@/lib/admin/guards": { isValidCityId: (value) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value) },
    "@/lib/admin/permissions": { canAccessCity: (admin, id) => admin.role !== "CITY_ADMIN" || admin.city_ids.includes(id) },
    "@/lib/supabase/env": { SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
    "@/lib/ingestion/boundaryPreparation": {
      analyzeBoundarySource: () => ({ geometry, coordinateCount: 5, sizeBytes: 90, ringCount: 1,
        bounds: { west: 0, south: 0, east: 1, north: 1 }, projection: { definition: "local AEQD" } }),
      maxPreparationBytes: 5 * 1024 * 1024, boundaryTolerancesMeters: [0.1, 0.5],
      prepareBoundaryCandidate: () => candidate,
    },
    "@/lib/ingestion/cityBoundary": { parseCityBoundary: (value) => value },
  };
  return {
    state,
    list: load("app/api/admin/ingestion/boundary-preparations/route.ts", mocks),
    detail: load("app/api/admin/ingestion/boundary-preparations/[preparationId]/route.ts", mocks),
  };
}

const jsonRequest = (url, body) => new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("preparation upload and list enforce city scope and persist source attribution", async () => {
  const { state, list } = fixture();
  state.cities = [];
  const denied = await list.POST(jsonRequest("http://local", { city_id: city, source_url: "https://example.test", source_version: "v1", geometry }));
  assert.equal(denied.status, 403);
  assert.equal(state.calls.length, 0);
  state.cities = [city];
  const created = await list.POST(jsonRequest("http://local", { city_id: city, source_url: "https://example.test", source_version: "v1", geometry }));
  assert.equal(created.status, 200);
  assert.equal(state.calls[0].name, "osm_create_boundary_preparation");
  assert.equal(state.calls[0].args.p_source_geometry.type, "Polygon");
  assert.equal(state.calls[0].args.p_source_coordinate_count, 5);
  assert.match(state.calls[0].args.p_source_hash, /^[0-9a-f]{64}$/);
});

test("candidate generation validates and stores the prepared geometry with the actor", async () => {
  const { state, detail } = fixture();
  const result = await detail.POST(jsonRequest("http://local", { operation: "prepare", tolerance_meters: 0.1 }), { params: { preparationId } });
  assert.equal(result.status, 200);
  assert.deepEqual(state.calls.map((call) => call.name), ["osm_get_boundary_preparation", "osm_save_boundary_preparation_candidate"]);
  assert.equal(state.calls[1].args.p_prepared_geometry.type, "Polygon");
  assert.equal(state.calls[1].args.p_prepared_coordinate_count, 5);
  assert.equal(state.calls[1].args.p_actor_auth_uid, user);
  assert.equal(result.body.candidate_version, 1);
});

test("approval and registration dispatch only to governed RPCs", async () => {
  const { state, detail } = fixture();
  assert.equal((await detail.POST(jsonRequest("http://local", { operation: "approve", acknowledge_boundary_differences: true }), { params: { preparationId } })).status, 200);
  assert.equal((await detail.POST(jsonRequest("http://local", { operation: "register" }), { params: { preparationId } })).status, 200);
  assert.deepEqual(state.calls.slice(-2).map((call) => call.name), ["osm_approve_boundary_preparation", "osm_register_prepared_boundary"]);
});
