const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const cityId = "11111111-1111-4111-8111-111111111111";
const otherCityId = "22222222-2222-4222-8222-222222222222";
const entityId = "33333333-3333-4333-8333-333333333333";
const auditId = "44444444-4444-4444-8444-444444444444";
const adminId = "55555555-5555-4555-8555-555555555555";
const authId = "66666666-6666-4666-8666-666666666666";

function loadTypeScript(file, mocks) {
  const filename = path.join(root, file);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : originalRequire(id);
  mod._compile(compiled, filename);
  return mod.exports;
}

function fixture() {
  const state = {
    role: "CITY_ADMIN",
    cityIds: [cityId],
    entity: { id: entityId, city_id: cityId, status: "pending", is_published: false },
    calls: [],
    context: null,
    rpcResponse: null,
    rpcThrows: false,
  };
  const sessionClient = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() {
          return { data: table === "cities" ? { id: cityId } : state.entity, error: null };
        },
      };
    },
  };
  const service = loadTypeScript("lib/admin/civicEntityMutations.ts", {
    "server-only": {},
    "@supabase/supabase-js": {
      createClient: () => ({
        async rpc(name, args) {
          state.calls.push({ name, args });
          if (state.rpcThrows) throw new Error("connection lost");
          if (state.rpcResponse) return state.rpcResponse;
          const nextStatus = {
            create_pending: "pending", edit_metadata: state.entity.status,
            approve: "approved", hide: "hidden", restore: "pending",
          }[args.p_operation];
          return {
            data: {
              entity_id: args.p_object_id || entityId, city_id: args.p_expected_city_id,
              audit_id: auditId, operation: args.p_operation,
              status: nextStatus, is_published: nextStatus === "approved",
            },
            error: null, status: 200,
          };
        },
      }),
    },
    "@/lib/admin/context": {
      resolveAdminContext: async () => state.context || ({
        ok: true,
        admin: { id: adminId, auth_uid: authId, role: state.role, city_ids: state.cityIds },
      }),
    },
    "@/lib/admin/permissions": {
      canAccessCity: (admin, city) =>
        ["CEO", "PLATFORM_ADMIN"].includes(admin.role) || admin.city_ids.includes(city),
    },
    "@/lib/admin/guards": {
      isValidCityId: (value) => typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    },
    "@/lib/supabase/server": { createSupabaseServerClient: () => sessionClient },
    "@/lib/supabase/env": { SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
  });
  return { state, service };
}

test("Entity creation and edits enforce the RPC field contract", async () => {
  const { service, state } = fixture();
  for (const key of ["status", "is_published", "city_id"]) {
    await assert.rejects(service.editCivicEntityMetadata(entityId, { [key]: null }),
      (error) => error.status === 400 && error.code === "invalid_input");
  }
  for (const invalid of [{}, { name: "" }, { birth_year: 1.5 }, { tags: ["ok", 1] }]) {
    await assert.rejects(service.editCivicEntityMetadata(entityId, invalid), { status: 400 });
  }
  await assert.rejects(service.createPendingCivicEntity("seattle", { name: "Entity" }), { status: 400 });
  const result = await service.createPendingCivicEntity("seattle", { name: "Entity", entity_type: "person" });
  assert.deepEqual(result, {
    entityId, cityId, operation: "create_pending", status: "pending", isPublished: false, auditId,
  });
  assert.deepEqual(state.calls[0].args, {
    p_actor_admin_id: adminId, p_actor_auth_uid: authId, p_expected_city_id: cityId,
    p_operation: "create_pending", p_object_id: null, p_object_data: { name: "Entity", entity_type: "person" },
  });
  await service.editCivicEntityMetadata(entityId, { description: null });
  assert.equal(state.calls[1].args.p_operation, "edit_metadata");
});

test("Entity lifecycle enforces role and city permissions before the RPC", async () => {
  const { service, state } = fixture();
  for (const [role, allowed] of [
    ["CITY_ADMIN", ["approve", "hide", "restore"]],
    ["CEO", ["hide", "restore"]],
    ["PLATFORM_ADMIN", []],
    ["EDITOR", []],
  ]) {
    state.role = role;
    for (const operation of ["approve", "hide", "restore"]) {
      if (allowed.includes(operation)) {
        const result = await service.transitionCivicEntity(entityId, operation);
        assert.equal(result.auditId, auditId);
      } else {
        await assert.rejects(service.transitionCivicEntity(entityId, operation), { status: 403 });
      }
    }
  }
  state.role = "CITY_ADMIN";
  state.cityIds = [otherCityId];
  await assert.rejects(service.transitionCivicEntity(entityId, "approve"), { status: 403 });
  state.context = { ok: false, reason: "inactive" };
  await assert.rejects(service.getCivicEntityActions(entityId), { status: 403 });
  state.context = { ok: false, reason: "unauthenticated" };
  await assert.rejects(service.getCivicEntityActions(entityId), { status: 401 });
});

test("action flags reflect current state and never grant Platform Admin lifecycle transitions", async () => {
  const { service, state } = fixture();
  assert.equal((await service.getCivicEntityActions(entityId)).canApprove, true);
  state.entity.status = "approved";
  state.entity.is_published = true;
  assert.equal((await service.getCivicEntityActions(entityId)).canHide, true);
  state.role = "PLATFORM_ADMIN";
  assert.equal((await service.getCivicEntityActions(entityId)).canHide, false);
  state.role = "CEO";
  state.entity.status = "hidden";
  state.entity.is_published = false;
  assert.equal((await service.getCivicEntityActions(entityId)).canRestore, true);
});

test("missing audit confirmation and transport failures are unconfirmed, not successful", async () => {
  const { service, state } = fixture();
  state.rpcResponse = {
    data: { entity_id: entityId, city_id: cityId, operation: "approve", status: "approved", is_published: true },
    error: null, status: 200,
  };
  await assert.rejects(service.transitionCivicEntity(entityId, "approve"), { code: "unconfirmed" });
  state.rpcResponse = null;
  state.rpcThrows = true;
  await assert.rejects(service.transitionCivicEntity(entityId, "approve"), { code: "unconfirmed" });
  state.rpcThrows = false;
  state.rpcResponse = { data: null, error: { code: "", message: "fetch failed" }, status: 0 };
  await assert.rejects(service.transitionCivicEntity(entityId, "approve"), { code: "unconfirmed" });
});

test("database transition and permission rechecks produce actionable errors", async () => {
  const { service, state } = fixture();
  for (const [message, status, code] of [
    ["Invalid civic lifecycle transition: approve from approved / t", 409, "invalid_transition"],
    ["Actor is not an active authorized administrator", 403, "forbidden"],
    ["Civic object city changed or is unavailable", 409, "conflict"],
  ]) {
    state.rpcResponse = { data: null, error: { code: "P0001", message }, status: 400 };
    await assert.rejects(service.transitionCivicEntity(entityId, "approve"), { status, code });
  }
  state.rpcResponse = {
    data: null,
    error: { code: "23514", message: "this city requires a published panorama before publishing" },
    status: 400,
  };
  await assert.rejects(service.transitionCivicEntity(entityId, "approve"), { status: 409, code: "panorama_required" });
});

test("create and metadata endpoints pass validated requests to the Entity service", async () => {
  const { service, state } = fixture();
  const next = {
    NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) },
  };
  const response = loadTypeScript("app/api/admin/civic-entities/response.ts", {
    "next/server": next, "@/lib/admin/civicEntityMutations": service,
  });
  const create = loadTypeScript("app/api/admin/civic-entities/route.ts", {
    "next/server": next, "@/lib/admin/civicEntityMutations": service, "./response": response,
  });
  const edit = loadTypeScript("app/api/admin/civic-entities/[entityId]/route.ts", {
    "next/server": next, "@/lib/admin/civicEntityMutations": service, "../response": response,
  });
  const created = await create.POST(new Request("http://local", {
    method: "POST", body: JSON.stringify({ citySlug: "seattle", name: "Entity", entity_type: "person" }),
  }));
  assert.equal(created.body.result.auditId, auditId);
  const rejected = await edit.PATCH(new Request("http://local", {
    method: "PATCH", body: JSON.stringify({ is_published: true }),
  }), { params: { entityId } });
  assert.equal(rejected.status, 400);
  const updated = await edit.PATCH(new Request("http://local", {
    method: "PATCH", body: JSON.stringify({ summary: "Updated" }),
  }), { params: { entityId } });
  assert.equal(updated.body.result.operation, "edit_metadata");
  assert.equal(state.calls.length, 2);
});

test("lifecycle endpoint rejects unknown operations and nonempty bodies", async () => {
  const { service, state } = fixture();
  const next = {
    NextResponse: {
      json: (body, options) => ({ body, status: options?.status || 200 }),
    },
  };
  const response = loadTypeScript("app/api/admin/civic-entities/response.ts", {
    "next/server": next,
    "@/lib/admin/civicEntityMutations": service,
  });
  const route = loadTypeScript("app/api/admin/civic-entities/[entityId]/[operation]/route.ts", {
    "next/server": next,
    "@/lib/admin/civicEntityMutations": service,
    "../../response": response,
  });
  const params = { entityId, operation: "approve" };
  assert.equal((await route.POST(new Request("http://local", { method: "POST", body: '{"status":"approved"}' }), { params })).status, 400);
  assert.equal((await route.POST(new Request("http://local", { method: "POST" }), { params: { ...params, operation: "delete" } })).status, 404);
  const result = await route.POST(new Request("http://local", { method: "POST" }), { params });
  assert.equal(result.body.result.auditId, auditId);
  assert.equal(state.calls.length, 1);
});
