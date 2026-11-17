const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../lib/entities/entityClient.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = new Module(filename, module);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(compiled, filename);
const { entityRequest, readEntityMutation, readEntityActions, saveEntityRelationships } = mod.exports;

test("mutation confirmation requires both an Entity ID and audit ID", () => {
  assert.deepEqual(readEntityMutation({ result: { entityId: "entity", auditId: "audit" } }),
    { entityId: "entity", auditId: "audit" });
  assert.throws(() => readEntityMutation({ result: { entityId: "entity" } }),
    (error) => error.unconfirmed === true);
});

test("action permissions must be explicitly present", () => {
  const actions = {
    status: "pending", isPublished: false, canEdit: true,
    canApprove: true, canHide: false, canRestore: false,
  };
  assert.deepEqual(readEntityActions({ actions }), actions);
  assert.throws(() => readEntityActions({ actions: { ...actions, canApprove: undefined } }));
});

test("transport, server, and malformed success responses are unconfirmed", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => { throw new Error("offline"); };
  await assert.rejects(entityRequest("/entity"), (error) => error.unconfirmed);
  global.fetch = async () => new Response(JSON.stringify({ error: "failed" }), { status: 500 });
  await assert.rejects(entityRequest("/entity"), (error) =>
    error.unconfirmed && error.message.includes("verify before retrying"));
  global.fetch = async () => new Response("invalid", { status: 200 });
  await assert.rejects(entityRequest("/entity"), (error) => error.unconfirmed);
  global.fetch = async () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  await assert.rejects(entityRequest("/entity"), (error) =>
    !error.unconfirmed && error.message === "Forbidden");
});

function relationshipClient(deleteError, insertError) {
  const calls = [];
  return {
    calls,
    from(table) {
      assert.equal(table, "civic_relationships");
      return {
        delete() {
          calls.push("delete");
          return {
            eq(field, value) {
              calls.push([field, value]);
              return field === "from_id" ? Promise.resolve({ error: deleteError }) : this;
            },
          };
        },
        async insert(rows) {
          calls.push(rows);
          return { error: insertError };
        },
      };
    },
  };
}

test("relationship replacement uses the created Entity ID and surfaces both write errors", async () => {
  const rows = [{ from_type: "entity", from_id: null, to_type: "event", to_id: "event-id" }];
  const client = relationshipClient(null, null);
  await saveEntityRelationships(client, "entity-id", rows);
  assert.deepEqual(client.calls, [
    "delete", ["from_type", "entity"], ["from_id", "entity-id"],
    [{ from_type: "entity", from_id: "entity-id", to_type: "event", to_id: "event-id" }],
  ]);
  const deleteFailure = relationshipClient(new Error("delete failed"), null);
  await assert.rejects(saveEntityRelationships(deleteFailure, "entity-id", rows), /delete failed/);
  assert.equal(deleteFailure.calls.length, 3);
  const insertFailure = relationshipClient(null, new Error("insert failed"));
  await assert.rejects(saveEntityRelationships(insertFailure, "entity-id", rows), /insert failed/);
  const retry = relationshipClient(null, null);
  await saveEntityRelationships(retry, "entity-id", []);
  assert.equal(retry.calls.length, 3);
});

test("create form retries relationships without creating a second Entity", async () => {
  const states = [];
  let cursor = 0;
  let effectStarted = false;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = value; }];
    },
    useEffect(effect) {
      if (!effectStarted) { effectStarted = true; effect(); }
    },
  };
  const selector = () => null;
  const pushes = [];
  const requests = [];
  const relationshipCalls = [];
  const client = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        async single() { return { data: { id: "city-id" } }; },
        async order() { return { data: [] }; },
      };
    },
  };
  const mocks = {
    react,
    "next/navigation": { useRouter: () => ({ push: (url) => pushes.push(url) }) },
    "@/lib/supabase/client": { createBrowserClient: () => client },
    "@/components/relationships/RelationshipSelector": { __esModule: true, default: selector },
    "@/lib/entities/entityClient": {
      ...mod.exports,
      entityRequest: async (url, init) => {
        requests.push({ url, init });
        return { result: { entityId: "entity-id", auditId: "audit-id" } };
      },
      saveEntityRelationships: async (_client, id, relationships) => {
        relationshipCalls.push({ id, relationships });
        if (relationshipCalls.length === 1) throw new Error("relationship write failed");
      },
    },
  };
  for (const name of ["EntityThumbnailUpload", "EntityHeroImageUpload", "EntityHero360Upload", "EntityMediaUpload"]) {
    mocks[`@/components/entities/${name}`] = { __esModule: true, default: () => null };
  }
  const pageFile = path.resolve(__dirname, "../app/[citySlug]/entities/create/page.tsx");
  const pageModule = new Module(pageFile, module);
  pageModule.filename = pageFile;
  pageModule.paths = Module._nodeModulePaths(path.dirname(pageFile));
  const originalRequire = pageModule.require.bind(pageModule);
  pageModule.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : originalRequire(id);
  pageModule._compile(ts.transpileModule(fs.readFileSync(pageFile, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, pageFile);
  function render() {
    cursor = 0;
    return pageModule.exports.default({ params: { citySlug: "seattle" } });
  }
  function find(node, predicate) {
    if (!node || typeof node !== "object") return undefined;
    if (predicate(node)) return node;
    for (const child of [].concat(node.props?.children || [])) {
      const result = find(child, predicate);
      if (result) return result;
    }
  }
  render();
  await new Promise((resolve) => setImmediate(resolve));
  let tree = render();
  find(tree, (node) => node.type === "input").props.onChange({ target: { value: "Test Entity" } });
  tree = render();
  find(tree, (node) => node.type === "select").props.onChange({ target: { value: "person" } });
  tree = render();
  find(tree, (node) => node.type === selector).props.onChange([
    { from_type: "entity", from_id: null, to_type: "event", to_id: "event-id" },
  ]);
  tree = render();
  await find(tree, (node) => node.type === "button" && node.props.children === "Create Entity").props.onClick();
  tree = render();
  assert.equal(find(tree, (node) => node.type === "fieldset").props.disabled, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "/api/admin/civic-entities");
  const payload = JSON.parse(requests[0].init.body);
  assert.equal(payload.name, "Test Entity");
  assert.equal(payload.entity_type, "person");
  assert.equal(payload.citySlug, "seattle");
  for (const key of ["slug", "city_id", "status", "is_published"]) assert.equal(key in payload, false);
  await find(tree, (node) => node.type === "button" && node.props.children === "Retry Relationships").props.onClick();
  assert.equal(requests.length, 1);
  assert.deepEqual(relationshipCalls.map((call) => call.id), ["entity-id", "entity-id"]);
  assert.deepEqual(pushes, ["/seattle/entities"]);
});

test("edit form separates metadata PATCH from state-gated lifecycle actions", async (t) => {
  const states = [];
  let cursor = 0;
  let effectStarted = false;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = value; }];
    },
    useEffect(effect) { if (!effectStarted) { effectStarted = true; effect(); } },
  };
  const entity = { id: "entity-id", name: "Test", slug: "test", entity_type: "person" };
  const client = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        async single() { return { data: table === "cities" ? { id: "city-id" } : entity }; },
        async order() { return { data: [] }; },
        then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); },
      };
    },
  };
  const requests = [];
  const pushes = [];
  let status = "pending";
  const selector = () => null;
  const mocks = {
    react,
    "next/navigation": { useRouter: () => ({ push: (url) => pushes.push(url) }) },
    "@/lib/supabase/client": { createBrowserClient: () => client },
    "@/components/relationships/RelationshipSelector": { __esModule: true, default: selector },
    "@/lib/entities/entityClient": {
      ...mod.exports,
      entityRequest: async (url, init) => {
        requests.push({ url, init });
        if (!init) return { actions: {
          status, isPublished: status === "approved", canEdit: true,
          canApprove: status === "pending", canHide: status === "approved", canRestore: false,
        } };
        if (url.endsWith("/approve")) status = "approved";
        return { result: { entityId: "entity-id", auditId: "audit-id" } };
      },
    },
  };
  for (const name of ["EntityThumbnailUpload", "EntityHeroImageUpload", "EntityHero360Upload", "EntityMediaUpload"]) {
    mocks[`@/components/entities/${name}`] = { __esModule: true, default: () => null };
  }
  const pageFile = path.resolve(__dirname, "../app/[citySlug]/entities/[entitySlug]/edit/page.tsx");
  const pageModule = new Module(pageFile, module);
  pageModule.filename = pageFile;
  pageModule.paths = Module._nodeModulePaths(path.dirname(pageFile));
  const originalRequire = pageModule.require.bind(pageModule);
  pageModule.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : originalRequire(id);
  pageModule._compile(ts.transpileModule(fs.readFileSync(pageFile, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, pageFile);
  function render() {
    cursor = 0;
    return pageModule.exports.default({ params: { citySlug: "seattle", entitySlug: "test" } });
  }
  function find(node, predicate) {
    if (!node || typeof node !== "object") return undefined;
    if (predicate(node)) return node;
    for (const child of [].concat(node.props?.children || [])) {
      const result = find(child, predicate);
      if (result) return result;
    }
  }
  const originalConfirm = global.confirm;
  global.confirm = () => true;
  t.after(() => { global.confirm = originalConfirm; });
  render();
  await new Promise((resolve) => setImmediate(resolve));
  let tree = render();
  assert.ok(find(tree, (node) => node.type === "button" && node.props.children === "Approve"));
  assert.equal(find(tree, (node) => node.type === "button" && node.props.children === "Hide"), undefined);
  await find(tree, (node) => node.type === "button" && node.props.children === "Approve").props.onClick();
  tree = render();
  assert.ok(find(tree, (node) => node.type === "button" && node.props.children === "Hide"));
  await find(tree, (node) => node.type === "button" && node.props.children === "Save Metadata").props.onClick();
  const mutationRequests = requests.filter((request) => request.init);
  assert.equal(mutationRequests[0].url, "/api/admin/civic-entities/entity-id/approve");
  assert.equal(mutationRequests[0].init.method, "POST");
  assert.equal(mutationRequests[1].url, "/api/admin/civic-entities/entity-id");
  assert.equal(mutationRequests[1].init.method, "PATCH");
  const payload = JSON.parse(mutationRequests[1].init.body);
  for (const key of ["city_id", "status", "is_published"]) assert.equal(key in payload, false);
  assert.deepEqual(pushes, ["/seattle/entities/test"]);
});
