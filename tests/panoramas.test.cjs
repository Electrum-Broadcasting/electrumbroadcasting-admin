const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const city = "11111111-1111-4111-8111-111111111111";
const otherCity = "22222222-2222-4222-8222-222222222222";
const objectId = "33333333-3333-4333-8333-333333333333";
const panorama = "44444444-4444-4444-8444-444444444444";
const admin = "55555555-5555-4555-8555-555555555555";
const auth = "66666666-6666-4666-8666-666666666666";
const audit = "77777777-7777-4777-8777-777777777777";
const uuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

function load(file, mocks = {}) {
  const filename = path.join(root, file);
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
    role: "CITY_ADMIN", cities: [city], rpc: [], uploads: [], removed: [],
    rpcResult: { data: { id: panorama, audit_id: audit }, error: null, status: 200 },
    cleanupError: null,
  };
  class CivicObjectMutationError extends Error {
    constructor(message, status, code) { super(message); this.status = status; this.code = code; }
  }
  const client = {
    from(table) {
      const filters = [];
      return {
        select() { return this; },
        eq(name, value) { filters.push([name, value]); return this; },
        async maybeSingle() {
          if (table === "civic_places") return { data: { id: objectId, city_id: city }, error: null };
          return { data: filters.some(([key, value]) => key === "id" && value !== panorama) ? null : { id: panorama }, error: null };
        },
      };
    },
    storage: { from: () => ({
      async upload(name, bytes, options) { state.uploads.push({ name, bytes, options }); return { error: null }; },
      async remove(paths) { state.removed.push(...paths); return { error: state.cleanupError }; },
      getPublicUrl(name) { return { data: { publicUrl: `https://example.test/universal-media/${name}` } }; },
    }) },
    async rpc(name, args) { state.rpc.push({ name, args }); return state.rpcResult; },
  };
  const service = load("lib/admin/panoramas.ts", {
    "server-only": {},
    "@supabase/supabase-js": { createClient: () => client },
    "@/lib/admin/context": { resolveAdminContext: async () => ({ ok: true, admin: {
      id: admin, auth_uid: auth, role: state.role, city_ids: state.cities,
    } }) },
    "@/lib/admin/civicObjectMutations": { CivicObjectMutationError },
    "@/lib/admin/guards": { isValidCityId: uuid },
    "@/lib/admin/permissions": { canAccessCity: (actor, id) =>
      ["CEO", "PLATFORM_ADMIN"].includes(actor.role) || actor.city_ids.includes(id) },
    "@/lib/supabase/env": { SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" },
  });
  return { service, state };
}

async function image(width, height, format = "jpeg") {
  return sharp({ create: { width, height, channels: 3, background: "blue" } })[format]().toBuffer();
}

function form(bytes, type = "image/jpeg") {
  const result = new FormData();
  result.set("file", new File([bytes], "panorama", { type }));
  result.set("label", "Test panorama");
  result.set("description", "");
  return result;
}

test("valid JPEG and WebP uploads use city paths and verified actor identity", async () => {
  for (const [format, mime] of [["jpeg", "image/jpeg"], ["webp", "image/webp"]]) {
    const { service, state } = fixture();
    const result = await service.createPanorama("place", objectId, form(await image(2048, 1024, format), mime));
    assert.equal(result.audit_id, audit);
    assert.match(state.uploads[0].name, new RegExp(`^cities/${city}/panoramas/civic_place/${objectId}/`));
    assert.equal(state.rpc[0].name, "admin_create_panorama");
    assert.equal(state.rpc[0].args.p_actor_admin_id, admin);
    assert.equal(state.rpc[0].args.p_actor_auth_uid, auth);
    assert.equal(state.rpc[0].args.p_expected_city_id, city);
  }
});

test("invalid formats, mismatched MIME, dimensions and corrupt data never upload", async () => {
  const { service, state } = fixture();
  const jpeg = await image(2048, 1024);
  for (const input of [
    form(jpeg, "image/png"),
    form(jpeg, "image/webp"),
    form(await image(2048, 1023)),
    form(await image(2046, 1023)),
    form(Buffer.from("not an image")),
  ]) await assert.rejects(service.createPanorama("place", objectId, input), { status: 400 });
  assert.equal(state.uploads.length, 0);
  assert.equal(state.rpc.length, 0);
});

test("maximum dimensions and file size are enforced", async () => {
  const { service, state } = fixture();
  await service.createPanorama("place", objectId, form(await image(8192, 4096)));
  await assert.rejects(service.createPanorama("place", objectId, form(await image(8194, 4097))), { status: 400 });
  await assert.rejects(service.createPanorama("place", objectId, form(Buffer.alloc(50 * 1024 * 1024 + 1))), { status: 400 });
  assert.equal(state.uploads.length, 1);
});

test("authorization enforces the role and city matrix before upload", async () => {
  const { service, state } = fixture();
  const input = form(await image(2048, 1024));
  for (const role of ["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"]) {
    state.role = role;
    state.cities = role === "CITY_ADMIN" ? [city] : [otherCity];
    await service.createPanorama("place", objectId, input);
  }
  state.role = "EDITOR";
  await assert.rejects(service.createPanorama("place", objectId, input), { status: 403 });
  state.role = "CITY_ADMIN";
  state.cities = [otherCity];
  await assert.rejects(service.createPanorama("place", objectId, input), { status: 403 });
  assert.equal(state.uploads.length, 3);
});

test("rejected creation removes the upload; ambiguous creation retains it", async () => {
  const { service, state } = fixture();
  const input = form(await image(2048, 1024));
  state.rpcResult = { data: null, error: { message: "rejected" }, status: 400 };
  await assert.rejects(service.createPanorama("place", objectId, input), { code: "rejected" });
  assert.equal(state.removed[0], state.uploads[0].name);
  state.rpcResult = { data: null, error: { message: "timeout" }, status: 503 };
  await assert.rejects(service.createPanorama("place", objectId, input), { code: "unconfirmed" });
  assert.equal(state.removed.length, 1);
  state.rpcResult = { data: { id: panorama }, error: null, status: 200 };
  await assert.rejects(service.createPanorama("place", objectId, input), { code: "unconfirmed" });
  assert.equal(state.removed.length, 1);
});

test("metadata, publication, archive and reorder invoke guarded RPCs", async () => {
  const { service, state } = fixture();
  await service.mutatePanorama("place", objectId, { operation: "metadata", id: panorama, data: {
    label: "New title", description: "New description", pan_x_initial: 0.3, pan_y_initial: 0.5,
  } });
  assert.deepEqual(state.rpc[0].args.p_data, {
    label: "New title", description: "New description", pan_x_initial: 0.3, pan_y_initial: 0.5,
  });
  await service.mutatePanorama("place", objectId, { operation: "publish", id: panorama });
  await service.mutatePanorama("place", objectId, { operation: "archive", id: panorama });
  assert.equal(state.rpc[1].args.p_status, "published");
  assert.equal(state.rpc[2].args.p_status, "archived");
  state.rpcResult = { data: { changed: 1 }, error: null, status: 200 };
  await service.mutatePanorama("place", objectId, { operation: "reorder", ids: [panorama] });
  assert.equal(state.rpc[3].name, "admin_reorder_panoramas");
  await assert.rejects(service.mutatePanorama("place", objectId, { operation: "metadata", id: panorama, data: {
    label: "x", description: "", pan_x_initial: 2, pan_y_initial: 0.5,
  } }), { status: 400 });
});

test("upload route authorizes before reading and bounds chunked request bodies", async () => {
  let allowed = false;
  let creates = 0;
  class CivicObjectMutationError extends Error {
    constructor(message, status, code) { super(message); this.status = status; this.code = code; }
  }
  const route = load("app/api/admin/civic-objects/[objectType]/[objectId]/panoramas/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    "@/lib/admin/panoramas": {
      checkPanoramaAccess: async () => { if (!allowed) throw new CivicObjectMutationError("Forbidden", 403, "forbidden"); },
      createPanorama: async () => { creates++; return { id: panorama, audit_id: audit }; },
    },
    "@/lib/admin/civicObjectMutations": { CivicObjectMutationError },
    "../../../response": {
      civicObjectErrorResponse: (error) => ({ status: error.status, body: { error: error.message } }),
      readCivicObjectBody: async () => ({}),
    },
  });
  const params = { params: { objectType: "place", objectId } };
  let read = false;
  const request = {
    headers: new Headers({ "content-type": "multipart/form-data; boundary=test" }),
    body: { getReader() { read = true; return { async read() { return { value: new Uint8Array(51 * 1024 * 1024 + 1), done: false }; }, async cancel() {} }; } },
  };
  assert.equal((await route.POST(request, params)).status, 403);
  assert.equal(read, false);
  allowed = true;
  assert.equal((await route.POST(request, params)).status, 413);
  assert.equal(creates, 0);
});
