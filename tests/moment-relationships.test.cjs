const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const city = "11111111-1111-4111-8111-111111111111";
const otherCity = "22222222-2222-4222-8222-222222222222";
const moment = "33333333-3333-4333-8333-333333333333";
const entity = "44444444-4444-4444-8444-444444444444";
const era = "55555555-5555-4555-8555-555555555555";
const place = "66666666-6666-4666-8666-666666666666";
const neighborhood = "77777777-7777-4777-8777-777777777777";
const story = "88888888-8888-4888-8888-888888888888";
const audit = "99999999-9999-4999-8999-999999999999";
const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function load(file, mocks = {}) {
  const filename = path.join(root, file);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return mod.exports;
}

const relationships = load("lib/moments/relationships.ts");
const permissions = load("lib/admin/permissions.ts");
const snapshot = {
  entities: [{ id: entity, role: null }], eras: [{ id: era }], places: [{ id: place }],
  neighborhoods: [{ id: neighborhood }], stories: [{ id: story }],
};

function fixture() {
  const state = {
    role: "CITY_ADMIN", cities: [city], failTable: null, calls: [],
    tables: {
      civic_moments: [{ id: moment, city_id: city }],
      moment_entities: [{ id: key, moment_id: moment, entity_id: entity, role: null }],
      moment_eras: [{ id: key, moment_id: moment, era_id: era }],
      moment_places: [{ id: key, moment_id: moment, place_id: place }],
      moment_neighborhoods: [{ id: key, moment_id: moment, neighborhood_id: neighborhood }],
      moment_stories: [{ id: key, moment_id: moment, story_id: story }],
      civic_entities: [{ id: entity, city_id: city }], civic_eras: [{ id: era, city_id: city }],
      civic_places: [{ id: place, city_id: city }], civic_neighborhoods: [{ id: neighborhood, city_id: city }],
      civic_stories: [{ id: story, city_id: city }],
    },
    rpc: { data: { sourceId: moment, cityId: city, changed: true, auditId: audit, addedCount: 1, removedCount: 0 }, error: null, status: 200 },
  };
  class CivicObjectMutationError extends Error {
    constructor(message, status, code) { super(message); this.status = status; this.code = code; }
  }
  const client = {
    from(table) {
      let filters = [];
      let start = 0;
      let end = Infinity;
      const builder = {
        select() { return this; },
        eq(name, value) { filters.push((row) => row[name] === value); return this; },
        in(name, values) { filters.push((row) => values.includes(row[name])); return this; },
        order() { return this; },
        range(from, to) { start = from; end = to; return this; },
        async maybeSingle() {
          const rows = state.tables[table].filter((row) => filters.every((filter) => filter(row)));
          return { data: rows[0] || null, error: state.failTable === table ? { message: "failed" } : null };
        },
        then(resolve, reject) {
          const rows = state.tables[table].filter((row) => filters.every((filter) => filter(row)));
          return Promise.resolve(state.failTable === table
            ? { data: null, error: { message: "failed" }, count: null }
            : { data: rows.slice(start, end + 1), error: null, count: rows.length }).then(resolve, reject);
        },
      };
      return builder;
    },
    async rpc(name, args) { state.calls.push({ name, args }); return state.rpc; },
  };
  const service = load("lib/admin/momentRelationships.ts", {
    "server-only": {},
    "@supabase/supabase-js": { createClient: () => client },
    "@/lib/admin/context": { resolveAdminContext: async () => ({ ok: true, admin: {
      id: entity, auth_uid: story, role: state.role, city_ids: state.cities,
    } }) },
    "@/lib/admin/civicObjectMutations": { CivicObjectMutationError },
    "@/lib/admin/permissions": permissions,
    "@/lib/supabase/env": { SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
    "@/lib/moments/relationships": relationships,
  });
  return { service, state };
}

test("authorized snapshot includes all families and nullable entity roles", async () => {
  const { service, state } = fixture();
  assert.deepEqual(await service.getMomentRelationships(moment), { cityId: city, snapshot });
  state.tables.civic_stories[0].city_id = otherCity;
  await assert.rejects(service.getMomentRelationships(moment), { code: "invalid_snapshot" });
});

test("snapshot reads every page rather than treating a truncated result as complete", async () => {
  const { service, state } = fixture();
  const ids = Array.from({ length: 1001 }, (_, index) =>
    `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`);
  state.tables.moment_entities = ids.map((id) => ({ id, moment_id: moment, entity_id: id, role: null }));
  state.tables.civic_entities = ids.map((id) => ({ id, city_id: city }));
  const result = await service.getMomentRelationships(moment);
  assert.equal(result.snapshot.entities.length, 1001);
  assert.equal(result.snapshot.entities.at(-1).id, ids.at(-1));
});

test("snapshot fails closed for missing families, invalid links, wrong city and denied role", async () => {
  const { service, state } = fixture();
  for (const table of ["moment_entities", "moment_stories", "moment_eras", "moment_places", "moment_neighborhoods"]) {
    state.failTable = table;
    await assert.rejects(service.getMomentRelationships(moment), { code: "snapshot_failed" });
  }
  state.failTable = null;
  state.tables.moment_places[0].place_id = null;
  await assert.rejects(service.getMomentRelationships(moment), { code: "invalid_snapshot" });
  state.tables.moment_places[0].place_id = place;
  state.cities = [otherCity];
  await assert.rejects(service.getMomentRelationships(moment), { status: 403 });
  state.cities = [city];
  state.role = "EDITOR";
  await assert.rejects(service.getMomentRelationships(moment), { status: 403 });
});

test("RPC receives the complete snapshot and confirms audit, no-op and city mismatch", async () => {
  const { service, state } = fixture();
  const result = await service.replaceMomentRelationships(moment, {
    cityId: city, snapshot, idempotencyKey: key, actorAdminId: key, actorAuthUid: key,
  });
  assert.equal(result.auditId, audit);
  assert.deepEqual(state.calls[0].args.p_entity_links, [{ id: entity, role: null }]);
  assert.deepEqual(state.calls[0].args.p_story_ids, [story]);
  assert.deepEqual(state.calls[0].args.p_era_ids, [era]);
  assert.deepEqual(state.calls[0].args.p_place_ids, [place]);
  assert.deepEqual(state.calls[0].args.p_neighborhood_ids, [neighborhood]);
  assert.equal(state.calls[0].args.p_actor_admin_id, entity);
  assert.equal(state.calls[0].args.p_actor_auth_uid, story);
  assert.equal(state.calls[0].args.p_idempotency_key, key);
  state.rpc = { data: { sourceId: moment, cityId: city, changed: false, auditId: null, addedCount: 0, removedCount: 0 }, error: null, status: 200 };
  assert.equal((await service.replaceMomentRelationships(moment, { cityId: city, snapshot, idempotencyKey: key })).auditId, null);
  await assert.rejects(service.replaceMomentRelationships(moment, { cityId: otherCity, snapshot, idempotencyKey: key }), { code: "city_changed" });
  await assert.rejects(service.replaceMomentRelationships(moment, { cityId: city, snapshot: { ...snapshot, stories: undefined }, idempotencyKey: key }), { status: 400 });
  assert.equal(state.calls.length, 2);
  state.rpc = { data: null, error: { message: "denied" }, status: 400 };
  await assert.rejects(service.replaceMomentRelationships(moment, { cityId: city, snapshot, idempotencyKey: key }), { code: "relationship_rejected" });
});

test("Moment relationship service enforces the role and city matrix", async () => {
  const { service, state } = fixture();
  for (const role of ["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"]) {
    state.role = role;
    state.cities = role === "CITY_ADMIN" ? [city] : [otherCity];
    await service.replaceMomentRelationships(moment, { cityId: city, snapshot, idempotencyKey: key });
  }
  assert.equal(state.calls.length, 3);
  state.role = "CITY_ADMIN";
  state.cities = [otherCity];
  await assert.rejects(service.replaceMomentRelationships(moment, { cityId: city, snapshot, idempotencyKey: key }), { status: 403 });
  state.role = "EDITOR";
  state.cities = [city];
  await assert.rejects(service.replaceMomentRelationships(moment, { cityId: city, snapshot, idempotencyKey: key }), { status: 403 });
  assert.equal(state.calls.length, 3);
});

test("Moment relationship service rejects invalid RPC confirmations as unconfirmed", async () => {
  const { service, state } = fixture();
  for (const result of [
    { sourceId: moment, cityId: city, changed: true, auditId: null, addedCount: 1, removedCount: 0 },
    { sourceId: moment, cityId: city, changed: false, auditId: audit, addedCount: 0, removedCount: 0 },
  ]) {
    state.rpc = { data: result, error: null, status: 200 };
    await assert.rejects(service.replaceMomentRelationships(moment, { cityId: city, snapshot, idempotencyKey: key }), { code: "unconfirmed" });
  }
});

test("uncertain retry reuses the same key and payload, and a completed save can be retried independently of graph", async () => {
  const calls = [];
  class CivicRequestError extends Error {
    constructor(message, unconfirmed = false) { super(message); this.unconfirmed = unconfirmed; }
  }
  const client = load("lib/moments/relationshipClient.ts", {
    "@/lib/moments/relationships": relationships,
    "@/lib/admin/civicObjectClient": {
      CivicRequestError,
      civicRequest: async (_url, init) => {
        calls.push(JSON.parse(init.body));
        if (calls.length === 1) throw new CivicRequestError("unconfirmed", true);
        if (calls.length === 2) throw new CivicRequestError("session unavailable");
        return { result: { sourceId: moment, cityId: city, changed: true, auditId: audit, addedCount: 1, removedCount: 0 } };
      },
    },
  });
  const saver = client.createMomentRelationshipSaver();
  await assert.rejects(saver.save(moment, city, snapshot), { unconfirmed: true });
  await assert.rejects(saver.save(moment, city, { ...snapshot, eras: [] }), { unconfirmed: true });
  await assert.rejects(saver.save(moment, city, snapshot), { unconfirmed: true });
  assert.equal(saver.hasPending(), true);
  assert.equal((await saver.save(moment, city, snapshot)).auditId, audit);
  assert.deepEqual(calls[0], calls[1]);
  assert.deepEqual(calls[1], calls[2]);
  await saver.save(moment, city, snapshot);
  assert.equal(calls.length, 3);
});
