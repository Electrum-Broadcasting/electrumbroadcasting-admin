const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const city = "11111111-1111-4111-8111-111111111111";
const otherCity = "22222222-2222-4222-8222-222222222222";
const objectId = "33333333-3333-4333-8333-333333333333";
const auditId = "44444444-4444-4444-8444-444444444444";
const adminId = "55555555-5555-4555-8555-555555555555";
const authId = "66666666-6666-4666-8666-666666666666";
const cases = {
  event: { table: "civic_events", create: { name: "Event", event_type: "other" }, edit: { casualties: 4, tags: ["history"] } },
  artifact: { table: "civic_artifacts", create: { title: "Artifact", artifact_type: "other" }, edit: { related_event_ids: [objectId] } },
  neighborhood: { table: "civic_neighborhoods", create: { name: "Neighborhood" }, edit: { description: null } },
  era: { table: "civic_eras", create: { name: "Era" }, edit: { start_year: 1900 } },
  moment: { table: "civic_moments", create: { title: "Moment", moment_time: "2026-01-01T00:00:00Z" }, edit: { inline_360_urls: ["url"] } },
};

function load(file, mocks) {
  const filename = path.join(root, file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
  mod._compile(source, filename);
  return mod.exports;
}

function fixture(type) {
  const state = {
    role: "CITY_ADMIN", cities: [city], calls: [], context: null, response: null,
    row: { id: objectId, city_id: city, status: "pending", is_published: false },
  };
  const service = load("lib/admin/civicObjectMutations.ts", {
    "server-only": {},
    "@supabase/supabase-js": {
      createClient: () => ({
        async rpc(name, args) {
          state.calls.push({ name, args });
          if (state.response) return state.response;
          const status = { create_pending: "pending", edit_metadata: state.row.status, approve: "approved", hide: "hidden", restore: "pending" }[args.p_operation];
          return {
            data: {
              [`${type}_id`]: args.p_object_id || objectId, city_id: args.p_expected_city_id,
              operation: args.p_operation, status, is_published: status === "approved", audit_id: auditId,
            },
            error: null, status: 200,
          };
        },
      }),
    },
    "@/lib/admin/context": { resolveAdminContext: async () => state.context || {
      ok: true, admin: { id: adminId, auth_uid: authId, role: state.role, city_ids: state.cities },
    } },
    "@/lib/admin/guards": { isValidCityId: (value) => typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) },
    "@/lib/admin/permissions": { canAccessCity: (admin, id) =>
      ["CEO", "PLATFORM_ADMIN"].includes(admin.role) || admin.city_ids.includes(id) },
    "@/lib/supabase/env": { SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
    "@/lib/supabase/server": { createSupabaseServerClient: () => ({
      from(table) {
        assert.ok(table === "cities" || table === cases[type].table);
        return { select() { return this; }, eq() { return this; }, async maybeSingle() {
          return { data: table === "cities" ? { id: city } : state.row, error: null };
        } };
      },
    }) },
  });
  return { service, state };
}

for (const [type, spec] of Object.entries(cases)) {
  test(`${type}: create, edit and all lifecycle calls use its RPC and audit confirmation`, async () => {
    const { service, state } = fixture(type);
    const result = await service.createPendingCivicObject(type, "seattle", spec.create);
    assert.equal(result[`${type}Id`], objectId);
    assert.equal(result.auditId, auditId);
    assert.equal(result.status, "pending");
    await service.editCivicObjectMetadata(type, objectId, spec.edit);
    for (const [operation, status] of [["approve", "approved"], ["hide", "hidden"], ["restore", "pending"]]) {
      const transition = await service.transitionCivicObject(type, objectId, operation);
      assert.equal(transition.status, status);
      assert.equal(transition.auditId, auditId);
    }
    assert.deepEqual(state.calls.map(({ name }) => name), Array(5).fill(`admin_mutate_civic_${type}`));
    assert.deepEqual(state.calls.map(({ args }) => args.p_operation), ["create_pending", "edit_metadata", "approve", "hide", "restore"]);
    assert.equal(state.calls[0].args.p_object_id, null);
    assert.equal(state.calls[0].args.p_actor_auth_uid, authId);
    assert.equal(state.calls[0].args.p_expected_city_id, city);
  });

  test(`${type}: payload and role/city checks reject unauthorized mutations`, async () => {
    const { service, state } = fixture(type);
    for (const key of ["status", "is_published", "city_id"]) {
      await assert.rejects(service.editCivicObjectMetadata(type, objectId, { [key]: null }), { status: 400 });
    }
    await assert.rejects(service.createPendingCivicObject(type, "seattle", {}), { status: 400 });
    for (const [role, operations] of [
      ["CITY_ADMIN", ["approve", "hide", "restore"]],
      ["CEO", ["hide", "restore"]],
      ["PLATFORM_ADMIN", []],
      ["EDITOR", []],
    ]) {
      state.role = role;
      if (role === "EDITOR") {
        await assert.rejects(service.createPendingCivicObject(type, "seattle", spec.create), { status: 403 });
        await assert.rejects(service.editCivicObjectMetadata(type, objectId, spec.edit), { status: 403 });
      } else {
        await service.createPendingCivicObject(type, "seattle", spec.create);
        await service.editCivicObjectMetadata(type, objectId, spec.edit);
      }
      for (const op of ["approve", "hide", "restore"]) {
        if (operations.includes(op)) await service.transitionCivicObject(type, objectId, op);
        else await assert.rejects(service.transitionCivicObject(type, objectId, op), { status: 403 });
      }
    }
    state.role = "CITY_ADMIN";
    state.cities = [otherCity];
    await assert.rejects(service.editCivicObjectMetadata(type, objectId, spec.edit), { status: 403 });
    state.context = { ok: false, reason: "inactive" };
    await assert.rejects(service.getCivicObjectActions(type, objectId), { status: 403 });
  });

  test(`${type}: missing audit confirmation is unconfirmed`, async () => {
    const { service, state } = fixture(type);
    state.response = { data: { [`${type}_id`]: objectId, city_id: city, operation: "approve", status: "approved", is_published: true }, error: null, status: 200 };
    await assert.rejects(service.transitionCivicObject(type, objectId, "approve"), { code: "unconfirmed" });
  });

  test(`${type}: create and edit endpoints invoke the mapped service`, async () => {
    const { service, state } = fixture(type);
    const next = { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } };
    const response = load("app/api/admin/civic-objects/response.ts", {
      "next/server": next, "@/lib/admin/civicObjectMutations": service,
    });
    const create = load("app/api/admin/civic-objects/[objectType]/route.ts", {
      "next/server": next, "@/lib/admin/civicObjectMutations": service, "../response": response,
    });
    const edit = load("app/api/admin/civic-objects/[objectType]/[objectId]/route.ts", {
      "next/server": next, "@/lib/admin/civicObjectMutations": service, "../../response": response,
    });
    const created = await create.POST(new Request("http://local", {
      method: "POST", body: JSON.stringify({ citySlug: "seattle", ...spec.create }),
    }), { params: { objectType: type } });
    assert.equal(created.body.result.auditId, auditId);
    const updated = await edit.PATCH(new Request("http://local", {
      method: "PATCH", body: JSON.stringify(spec.edit),
    }), { params: { objectType: type, objectId } });
    assert.equal(updated.body.result.operation, "edit_metadata");
    assert.equal(state.calls.length, 2);
  });
}

test("type-specific invalid payloads and endpoint dispatch are rejected", async () => {
  const { service, state } = fixture("moment");
  assert.throws(() => service.parseCivicObjectType("entity"), { status: 404 });
  assert.throws(() => service.parseCivicObjectData("moment", { title: "x", moment_time: "invalid" }, "create_pending"), { status: 400 });
  assert.throws(() => service.parseCivicObjectData("artifact", { related_event_ids: ["invalid"] }, "edit_metadata"), { status: 400 });
  const next = { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } };
  const response = load("app/api/admin/civic-objects/response.ts", { "next/server": next, "@/lib/admin/civicObjectMutations": service });
  const route = load("app/api/admin/civic-objects/[objectType]/[objectId]/[operation]/route.ts", {
    "next/server": next, "@/lib/admin/civicObjectMutations": service, "../../../response": response,
  });
  const params = { objectType: "moment", objectId, operation: "approve" };
  assert.equal((await route.POST(new Request("http://local", { method: "POST", body: '{"status":"approved"}' }), { params })).status, 400);
  assert.equal((await route.POST(new Request("http://local", { method: "POST" }), { params: { ...params, operation: "delete" } })).status, 404);
  assert.equal((await route.POST(new Request("http://local", { method: "POST" }), { params })).body.result.auditId, auditId);
  assert.equal(state.calls.length, 1);
});
