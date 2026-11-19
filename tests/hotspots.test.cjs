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

function fixture() {
  const state = {
    city, published: true, safetyHold: false, visible: true, panoramaStatus: "published",
    parentAllowed: true, hotspotPanorama: panorama, rpc: [], response: null,
    hotspot: { id: hotspotId, target_type: "civic_place", target_id: objectId, target_url: null },
    searchRows: [{ id: objectId, name: "Example", city_id: city, is_published: true }],
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
        ilike() { return this; },
        order() { return this; },
        async limit() { return { data: state.searchRows, error: null }; },
        async maybeSingle() {
          if (table === "panoramas") return { data: filters.id === panorama ? { id: panorama, status: state.panoramaStatus } : null, error: null };
          if (table === "hotspots") return { data: filters.id === hotspotId && filters.panorama_id === state.hotspotPanorama ? state.hotspot : null, error: null };
          return { data: filters.id === objectId ? { id: objectId, city_id: state.city, is_published: state.published, safety_hold: state.safetyHold } : null, error: null };
        },
      };
    },
    async rpc(name, args) {
      state.rpc.push({ name, args });
      if (state.response) return state.response;
      return { data: { id: hotspotId, audit_id: audit, is_active: name === "admin_set_hotspot_active" ? args.p_active : false }, error: null, status: 200 };
    },
  };
  const anonymous = {
    from() {
      return { select() { return this; }, eq() { return this; },
        async in() { return { data: state.visible ? [{ id: objectId }] : [], error: null }; },
        async maybeSingle() { return { data: state.visible ? { id: objectId } : null, error: null }; } };
    },
  };
  const filename = path.resolve(__dirname, "../lib/admin/hotspots.ts");
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const mocks = {
    "server-only": {},
    "@supabase/supabase-js": { createClient: () => anonymous },
    "@/lib/admin/panoramas": { authorizePanoramaParent: async () => {
      if (!state.parentAllowed) throw new CivicObjectMutationError("City access denied.", 403, "forbidden");
      return { service: client, cityId: city, objectType: "civic_place", objectId,
        admin: { id: actor, auth_uid: actor } };
    } },
    "@/lib/admin/civicObjectMutations": { CivicObjectMutationError },
    "@/lib/admin/guards": { isValidCityId: uuid },
    "@/lib/supabase/env": { SUPABASE_URL: "https://example.test", SUPABASE_ANON_KEY: "test" },
  };
  const original = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return { service: mod.exports, state };
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

test("rejects cross-city, unpublished, inaccessible and safety-held targets before mutation", async () => {
  const { service, state } = fixture();
  const save = (target = data) => service.mutateHotspot("place", objectId, panorama, { operation: "place", data: target });
  state.city = otherCity;
  await assert.rejects(save(), /different city/);
  state.city = city; state.published = false;
  await assert.rejects(save(), /published/);
  state.published = true; state.visible = false;
  await assert.rejects(save(), /publicly accessible/);
  state.visible = true; state.safetyHold = true;
  await assert.rejects(save({ ...data, target_type: "civic_story" }), /published/);
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

test("search only returns published candidates visible to anonymous users", async () => {
  const { service, state } = fixture();
  const search = () => service.searchHotspotTargets("place", objectId, panorama, "civic_place", "Example");
  assert.deepEqual(await search(), [{ id: objectId, label: "Example" }]);
  state.visible = false;
  assert.deepEqual(await search(), []);
  await assert.rejects(service.searchHotspotTargets("place", objectId, panorama, "civic_place", "%"), /search characters/);
});

test("activation rechecks publication and uncertain or malformed RPC outcomes fail closed", async () => {
  const { service, state } = fixture();
  state.published = false;
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "activate", id: hotspotId }), /published/);
  assert.equal(state.rpc.length, 0);
  state.published = true;
  state.response = { data: { id: hotspotId, is_active: false }, error: null, status: 200 };
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "activate", id: hotspotId }), { code: "unconfirmed" });
  state.response = { data: null, error: { message: "timeout" }, status: 503 };
  await assert.rejects(service.mutateHotspot("place", objectId, panorama, { operation: "place", data }), { code: "unconfirmed" });
});
