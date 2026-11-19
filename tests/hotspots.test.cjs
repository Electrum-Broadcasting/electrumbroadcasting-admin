const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const city = "11111111-1111-4111-8111-111111111111";
const otherCity = "22222222-2222-4222-8222-222222222222";
const objectId = "33333333-3333-4333-8333-333333333333";
const panorama = "44444444-4444-4444-8444-444444444444";
const hotspotId = "55555555-5555-4555-8555-555555555555";
const actor = "66666666-6666-4666-8666-666666666666";
const audit = "77777777-7777-4777-8777-777777777777";
const uuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

function load(filename, mocks = {}) {
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return mod.exports;
}

function fixture() {
  const state = {
    city, published: true, status: "approved", safetyHold: false, reviewStatus: "published", panoramaStatus: "published",
    parentAllowed: true, hotspotPanorama: panorama, rpc: [], response: null,
    hotspot: { id: hotspotId, target_type: "civic_place", target_id: objectId, target_url: null },
    searchRows: [{ id: objectId, name: "Example", city_id: city, is_published: true, status: "approved" }],
  };
  class CivicObjectMutationError extends Error {
    constructor(message, status, code) { super(message); this.status = status; this.code = code; }
  }
  const client = {
    from(table) {
      const filters = {};
      return {
        select() { return this; },
        eq(key, value) { filters[key] = value; return this; },
        or() { filters.allowedStatus = true; return this; },
        ilike() { return this; },
        order() { return this; },
        async limit() { return { data: state.searchRows.filter((row) =>
          Object.entries(filters).every(([key, value]) => key === "allowedStatus"
            ? row.status === null || row.status === "approved" : row[key] === value)), error: null }; },
        async maybeSingle() {
          if (table === "panoramas") return { data: filters.id === panorama ? { id: panorama, status: state.panoramaStatus } : null, error: null };
          if (table === "hotspots") return { data: filters.id === hotspotId && filters.panorama_id === state.hotspotPanorama ? state.hotspot : null, error: null };
          return { data: filters.id === objectId ? { id: objectId, city_id: state.city, is_published: state.published, status: state.status, safety_hold: state.safetyHold, review_status: state.reviewStatus } : null, error: null };
        },
      };
    },
    async rpc(name, args) {
      state.rpc.push({ name, args });
      if (state.response) return state.response;
      return { data: { id: hotspotId, audit_id: audit, is_active: name === "admin_set_hotspot_active" ? args.p_active : false }, error: null, status: 200 };
    },
  };
  const filename = path.resolve(__dirname, "../lib/admin/hotspots.ts");
  const mocks = {
    "server-only": {},
    "@/lib/hotspots/publicEligibility": load(path.resolve(__dirname, "../lib/hotspots/publicEligibility.ts")),
    "@/lib/admin/panoramas": { authorizePanoramaParent: async () => {
      if (!state.parentAllowed) throw new CivicObjectMutationError("City access denied.", 403, "forbidden");
      return { service: client, cityId: city, objectType: "civic_place", objectId,
        admin: { id: actor, auth_uid: actor } };
    } },
    "@/lib/admin/civicObjectMutations": { CivicObjectMutationError },
    "@/lib/admin/guards": { isValidCityId: uuid },
  };
  return { service: load(filename, mocks), state };
}

const data = { label: "Entrance", pan_x: 0.25, pan_y: 0.75, target_type: "civic_place", target_id: objectId, target_url: null };

test("places, updates, activates, deactivates and deletes through guarded RPCs", async () => {
  const { service, state } = fixture();
  for (const payload of [
    { operation: "place", data },
    { operation: "update", id: hotspotId, data },
    { operation: "activate", id: hotspotId },
    { operation: "deactivate", id: hotspotId },
    { operation: "delete", id: hotspotId },
  ]) {
    const result = await service.mutateHotspot("place", objectId, panorama, payload);
    assert.equal(result.audit_id, audit);
  }
  assert.deepEqual(state.rpc.map((item) => item.name), [
    "admin_place_hotspot", "admin_update_hotspot", "admin_set_hotspot_active", "admin_set_hotspot_active", "admin_delete_hotspot",
  ]);
  assert.equal(state.rpc[0].args.p_data.target_id, objectId);
  assert.equal(state.rpc[0].args.p_actor_admin_id, actor);
  assert.equal(state.rpc[2].args.p_active, true);
  assert.equal(state.rpc[3].args.p_active, false);
});

test("rejects cross-city, unpublished, safety-held and non-published-review targets before mutation", async () => {
  const { service, state } = fixture();
  const save = (target = data) => service.mutateHotspot("place", objectId, panorama, { operation: "place", data: target });
  state.city = otherCity;
  await assert.rejects(save(), /different city/);
  state.city = city; state.published = false;
  await assert.rejects(save(), /not eligible/);
  state.published = true; state.status = "pending";
  await assert.rejects(save(), /not eligible/);
  state.status = "approved"; state.safetyHold = true;
  await assert.rejects(save({ ...data, target_type: "civic_story" }), /not eligible/);
  state.safetyHold = false; state.reviewStatus = "approved";
  await assert.rejects(save({ ...data, target_type: "civic_story" }), /not eligible/);
  await assert.rejects(save({ ...data, target_type: "panorama" }), /Unsupported/);
  assert.equal(state.rpc.length, 0);
});

test("validates URLs, coordinates, panorama ownership and authorization", async () => {
  const { service, state } = fixture();
  const save = (target) => service.mutateHotspot("place", objectId, panorama, { operation: "place", data: target });
  await assert.rejects(save({ ...data, target_type: "external_url", target_url: "http://example.test" }), /HTTPS/);
  await assert.rejects(save({ ...data, pan_x: 1.01 }), /coordinates/);
  await save({ ...data, target_type: "external_url", target_url: "https://example.test/path" });
  assert.equal(state.rpc[0].args.p_data.target_id, null);
  state.hotspotPanorama = otherCity;
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "delete", id: hotspotId }), { status: 404 });
  state.parentAllowed = false;
  await assert.rejects(save(data), { status: 403 });
  assert.equal(state.rpc.length, 1);
});

test("validates every supported civic target and external URLs without creating a row", async () => {
  const { service, state } = fixture();
  for (const target_type of ["civic_entity", "civic_event", "civic_artifact", "civic_place", "civic_neighborhood", "civic_moment", "civic_story"]) {
    const result = await service.mutateHotspot("place", objectId, panorama, { operation: "validate", data: { ...data, target_type } });
    assert.equal(result.valid, true);
  }
  const result = await service.mutateHotspot("place", objectId, panorama, {
    operation: "validate", data: { target_type: "external_url", target_url: "https://example.test" },
  });
  assert.equal(result.valid, true);
  assert.equal(state.rpc.length, 0);
});

test("search applies the same eligibility contract without anonymous table access", async () => {
  const { service, state } = fixture();
  const search = () => service.searchHotspotTargets("place", objectId, panorama, "civic_place", "Example");
  assert.deepEqual(await search(), [{ id: objectId, label: "Example" }]);
  state.searchRows[0].city_id = otherCity;
  assert.deepEqual(await search(), []);
  state.searchRows[0].city_id = city;
  state.searchRows[0].is_published = false;
  assert.deepEqual(await search(), []);
  state.searchRows[0].is_published = true;
  state.searchRows[0].status = "pending";
  assert.deepEqual(await search(), []);
  state.searchRows[0].status = null;
  assert.deepEqual(await search(), [{ id: objectId, label: "Example" }]);
  state.searchRows = [{ id: objectId, title: "Example", city_id: city, is_published: true, review_status: "approved", safety_hold: false }];
  const stories = () => service.searchHotspotTargets("place", objectId, panorama, "civic_story", "Example");
  assert.deepEqual(await stories(), []);
  state.searchRows[0].review_status = "published";
  state.searchRows[0].safety_hold = true;
  assert.deepEqual(await stories(), []);
  state.searchRows[0].safety_hold = false;
  assert.deepEqual(await stories(), [{ id: objectId, label: "Example" }]);
  await assert.rejects(service.searchHotspotTargets("place", objectId, panorama, "civic_place", "%"), /search characters/);
});

test("activation rechecks publication and uncertain or malformed RPC outcomes fail closed", async () => {
  const { service, state } = fixture();
  state.published = false;
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "activate", id: hotspotId }), /not eligible/);
  state.published = true;
  state.hotspot.target_type = "civic_story";
  state.reviewStatus = "approved";
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "activate", id: hotspotId }), /not eligible/);
  state.reviewStatus = "published";
  state.safetyHold = true;
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "activate", id: hotspotId }), /not eligible/);
  assert.equal(state.rpc.length, 0);
  state.safetyHold = false;
  state.response = { data: { id: hotspotId, is_active: false }, error: null, status: 200 };
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "activate", id: hotspotId }), { code: "unconfirmed" });
  state.response = { data: null, error: { message: "timeout" }, status: 503 };
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "place", data }), { code: "unconfirmed" });
});

test("incomplete eligibility data fails closed", () => {
  const { isPubliclyEligibleHotspotTarget: eligible } = load(path.resolve(__dirname, "../lib/hotspots/publicEligibility.ts"));
  assert.equal(eligible("civic_place", city, { city_id: city, is_published: true }), false);
  assert.equal(eligible("civic_story", city, { city_id: city, is_published: true, review_status: "published" }), false);
  assert.equal(eligible("civic_story", city, { city_id: city, is_published: true, safety_hold: false }), false);
});
