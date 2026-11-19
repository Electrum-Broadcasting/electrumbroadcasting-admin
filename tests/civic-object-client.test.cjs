const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function load(file, mocks = {}) {
  const filename = path.join(root, file);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const requireOriginal = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : requireOriginal(id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText, filename);
  return mod.exports;
}

function fakeReact() {
  const states = [];
  const effects = [];
  let cursor = 0;
  return {
    begin() { cursor = 0; },
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = value; }];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (!effects[index] || dependencies.some((value, i) => value !== effects[index][i])) {
        effects[index] = dependencies;
        effect();
      }
    },
  };
}

function find(node, predicate) {
  if (!node || typeof node !== "object") return undefined;
  if (predicate(node)) return node;
  for (const child of [].concat(node.props?.children || [])) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

const types = ["event", "artifact", "neighborhood", "era", "moment"];
const client = load("lib/admin/civicObjectClient.ts");

test("civic client validates object-specific audit confirmation and action flags", () => {
  for (const type of types) {
    assert.equal(client.readCivicMutation({ result: { [`${type}Id`]: "id", auditId: "audit" } }, type), "id");
    assert.throws(() => client.readCivicMutation({ result: { [`${type}Id`]: "id" } }, type),
      (error) => error.unconfirmed);
    assert.throws(() => client.readCivicMutation({ result: { entityId: "id", auditId: "audit" } }, type),
      (error) => error.unconfirmed);
  }
  const flags = { status: "pending", isPublished: false, canEdit: true, canApprove: true, canHide: false, canRestore: false };
  assert.deepEqual(client.readCivicActions({ actions: flags }), flags);
  assert.throws(() => client.readCivicActions({ actions: { ...flags, canRestore: null } }));
});

  const pageSpecs = {
    event: { plural: "events", title: "Test Event", field: "name", extra: "event_type" },
    artifact: { plural: "artifacts", title: "Test Artifact", field: "title", extra: "artifact_type" },
    neighborhood: { plural: "neighborhoods", title: "Test Neighborhood", field: "name" },
    era: { plural: "eras", title: "Test Era", field: "name" },
    moment: { plural: "moments", title: "Test Moment", field: "title", extra: "moment_time" },
  };

  function fakeReadClient(object) {
    return {
      from(table) {
        return {
          select() { return this; },
          eq() { return this; },
          async single() { return { data: table === "cities" ? { id: "city-id" } : object }; },
          async order() { return { data: [] }; },
          then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); },
        };
      },
    };
  }

  for (const [type, spec] of Object.entries(pageSpecs)) {
    test(`${type}: create form passes only metadata to guarded creation`, async () => {
      const react = fakeReact();
      const calls = [];
      const linkCalls = [];
      const stubs = {};
      for (const name of ["EventBasicsForm", "EventDatesForm", "EventErasForm", "EventMetadataForm",
        "MomentBasicsForm", "MomentTimelineForm", "MomentSpatialForm", "Moment360Form", "RelationshipSelector"]) {
        stubs[name] = function Stub() {};
      }

      const mocks = {
        react,
        "next/navigation": { useRouter: () => ({ push() {} }) },
        "@/lib/supabase/client": { createBrowserClient: () => fakeReadClient(null) },
        "@/hooks/useCivicObjectMutation": {
          useCivicCreate: (objectType) => {
            assert.equal(objectType, type);
            return {
              busy: false, unconfirmed: false, createdId: null, error: null,
              create: async (data, saveLinks) => {
                calls.push(data);
                if (saveLinks) await saveLinks("object-id");
              },
            };
          },
        },
        "@/lib/admin/civicObjectClient": {
          ...client,
          saveCivicLinks: async (_supabase, table, source, target, id, targets) =>
            linkCalls.push({ table, source, target, id, targets }),
          saveCivicRelationships: async (_supabase, objectType, id, relationships) =>
            linkCalls.push({ table: "civic_relationships", objectType, id, relationships }),
        },
        "@/lib/moments/relationshipClient": {
          loadMomentRelationships: async () => ({ entities: [], eras: [], places: [], neighborhoods: [], stories: [] }),
          createMomentRelationshipSaver: () => ({
            hasPending: () => false, clearCompleted() {},
            save: async (id, _city, snapshot) => {
              linkCalls.push({ table: "moment_rpc", id, snapshot });
              return { changed: true, auditId: "audit-id" };
            },
          }),
        },
      };
      for (const [name, component] of Object.entries(stubs)) {
        const folder = name === "RelationshipSelector" ? "relationships" : name.startsWith("Event") ? "events" : "moments";
        mocks[`@/components/${folder}/${name}`] = { __esModule: true, default: component };
      }
      const page = load(`app/[citySlug]/${spec.plural}/create/page.tsx`, mocks).default;
      const render = () => { react.begin(); return page({ params: { citySlug: "seattle" } }); };
      render();
      await new Promise((resolve) => setImmediate(resolve));
      let tree = render();
      if (type === "event") {
        const basics = find(tree, (node) => node.type === stubs.EventBasicsForm);
        basics.props.setName(spec.title);
        basics.props.setEventType("Historical");
        find(tree, (node) => node.type === stubs.EventErasForm).props.setSelectedEraIds(["era-id"]);
      } else if (type === "moment") {
        find(tree, (node) => node.type === stubs.MomentBasicsForm).props.setTitle(spec.title);
        find(tree, (node) => node.type === stubs.MomentTimelineForm).props.setMomentTime("2020-01-02T03:04");
        find(tree, (node) => node.type === stubs.MomentTimelineForm).props.setSelectedEras(["era-id"]);
        find(tree, (node) => node.type === stubs.MomentSpatialForm).props.setSelectedPlaces(["place-id"]);
        find(tree, (node) => node.type === stubs.MomentSpatialForm).props.setSelectedNeighborhoods(["neighborhood-id"]);
      } else {
        const placeholder = type === "artifact" ? "Title" : "Name";
        find(tree, (node) => node.type === "input" && node.props.placeholder === placeholder)
          .props.onChange({ target: { value: spec.title } });
        if (type === "artifact") {
          find(tree, (node) => node.type === "input" && node.props.placeholder === "Artifact Type")
            .props.onChange({ target: { value: "photo" } });
        }
      }
      if (["event", "artifact", "moment"].includes(type)) {
        find(tree, (node) => node.type === stubs.RelationshipSelector).props.onChange([
          { from_type: type, from_id: null, to_type: "story", to_id: "story-id" },
        ]);
      }
      tree = render();
      await find(tree, (node) => node.type === "button" && node.props.children === `Create ${type[0].toUpperCase()}${type.slice(1)}`).props.onClick();
      assert.equal(calls.length, 1);
      assert.equal(calls[0][spec.field], spec.title);
      if (spec.extra) assert.ok(calls[0][spec.extra]);
      for (const key of ["city_id", "status", "is_published", "slug"]) assert.equal(key in calls[0], false);
      if (["event", "artifact", "moment"].includes(type)) {
        assert.ok(linkCalls.some((call) => call.table === "civic_relationships" && call.id === "object-id"));
      }
      if (type === "event") assert.ok(linkCalls.some((call) => call.table === "event_eras" && call.targets[0] === "era-id"));
      if (type === "moment") {
        assert.deepEqual(linkCalls.find((call) => call.table === "moment_rpc").snapshot, {
          entities: [], stories: [], eras: [{ id: "era-id" }], places: [{ id: "place-id" }],
          neighborhoods: [{ id: "neighborhood-id" }],
        });
      }
    });
  }
for (const [type, spec] of Object.entries(pageSpecs)) {
  test(`${type}: edit form saves metadata without publication or city changes`, async () => {
    const react = fakeReact();
    const saved = [];
    const object = {
      id: "object-id", name: spec.title, title: spec.title, slug: "test",
      event_type: "Historical", artifact_type: "photo", moment_time: "2020-01-02T03:04:00.000Z",
    };
    const noop = () => {};
    const fields = {
      name: spec.title, title: spec.title, slug: "test", eventType: "Historical",
      description: "", body: "", startDate: "", endDate: "", tags: "", thumbnail360Url: "",
      startYear: null, endYear: null, momentTime: object.moment_time,
      selectedPlaces: [], selectedNeighborhoods: [], selectedEras: [], inline360Urls: [],
      eras: [], selectedEraIds: [], entities: [], artifacts: [], stories: [], existingRelationships: [],
      selectedRelationships: [], relationshipsLoaded: true,
    };
    for (const name of ["Name", "Title", "Slug", "EventType", "Description", "Body", "StartDate",
      "EndDate", "Tags", "Thumbnail360Url", "StartYear", "EndYear", "MomentTime", "SelectedPlaces",
      "SelectedNeighborhoods", "SelectedEras", "Inline360Urls", "SelectedEraIds", "ExistingRelationships",
      "SelectedRelationships"]) fields[`set${name}`] = noop;
    const stubs = {};
    for (const name of ["EventBasicsForm", "EventDatesForm", "EventErasForm", "EventMetadataForm",
      "MomentBasicsForm", "MomentTimelineForm", "MomentSpatialForm", "Moment360Form", "RelationshipSelector",
      "CivicLifecycleControls"]) stubs[name] = function Stub() {};
    const mocks = {
      react,
      "next/navigation": { useRouter: () => ({ push() {} }) },
      "@/lib/supabase/client": { createBrowserClient: () => fakeReadClient(object) },
      "@/hooks/useCivicObjectMutation": {
        useCivicEdit: (objectType) => {
          assert.equal(objectType, type);
          return {
            actions: { canEdit: true }, busy: false, unconfirmed: false, error: null, message: null,
            save: async (data) => saved.push(data), saveLinks: noop, transition: noop,
          };
        },
      },
      "@/lib/admin/civicObjectClient": client,
      "@/lib/moments/relationshipClient": {
        createMomentRelationshipSaver: () => ({ hasPending: () => false, clearCompleted() {}, save: noop }),
      },
      "@/hooks/useLoadEvent": { useLoadEvent: () => ({ loading: false, event: object, ...fields }) },
      "@/hooks/useLoadEra": { useLoadEra: () => ({ loading: false, era: object, ...fields }) },
      "@/hooks/useLoadNeighborhood": { useLoadNeighborhood: () => ({ loading: false, neighborhood: object, ...fields }) },
      "@/hooks/useLoadMomentInitial": {
        useLoadMomentInitial: () => ({
          loading: false, initialData: { moment: object, relationshipsLoaded: true, events: [], entities: [], artifacts: [], stories: [] },
        }),
      },
      "@/hooks/useMomentState": { useMomentState: () => fields },
    };
    for (const [name, component] of Object.entries(stubs)) {
      const folder = name === "RelationshipSelector" ? "relationships"
        : name === "CivicLifecycleControls" ? "admin" : name.startsWith("Event") ? "events" : "moments";
      mocks[`@/components/${folder}/${name}`] = { __esModule: true, default: component };
    }
    const page = load(`app/[citySlug]/${spec.plural}/[${type}Slug]/edit/page.tsx`, mocks).default;
    const render = () => {
      react.begin();
      const tree = page({ params: { citySlug: "seattle", [`${type}Slug`]: "test" } });
      return type === "moment" && typeof tree.type === "function" ? tree.type(tree.props) : tree;
    };
    render();
    await new Promise((resolve) => setImmediate(resolve));
    const tree = render();
    assert.ok(find(tree, (node) => node.type === stubs.CivicLifecycleControls));
    assert.equal(find(tree, (node) => node.type === "button" && typeof node.props.children === "string"
      && node.props.children.startsWith("Delete")), undefined);
    await find(tree, (node) => node.type === "button" && node.props.children === "Save Metadata").props.onClick();
    assert.equal(saved.length, 1);
    assert.equal(saved[0][spec.field], spec.title);
    for (const key of ["city_id", "status", "is_published"]) assert.equal(key in saved[0], false);
  });
}

test("Moment edit preserves hidden entity roles and Story links, and retries graph separately", async () => {
  const react = fakeReact();
  const submitted = [];
  let graphCalls = 0;
  const momentSnapshot = {
    entities: [{ id: "entity-id", role: null }, { id: "other-entity", role: "witness" }],
    eras: [{ id: "old-era" }], places: [{ id: "old-place" }],
    neighborhoods: [{ id: "old-neighborhood" }], stories: [{ id: "story-id" }],
  };
  const object = { id: "moment-id", title: "Moment", slug: "moment", moment_time: "2020-01-02T03:04:00.000Z" };
  const stateFields = {
    title: "Moment", slug: "moment", body: "", momentTime: object.moment_time,
    selectedEras: ["new-era"], selectedPlaces: ["new-place"],
    selectedNeighborhoods: ["new-neighborhood"], selectedRelationships: [], inline360Urls: [], thumbnail360Url: "",
  };
  const stubs = {};
  for (const name of ["MomentBasicsForm", "MomentTimelineForm", "MomentSpatialForm", "Moment360Form",
    "RelationshipSelector", "CivicLifecycleControls"]) stubs[name] = function Stub() {};
  let completed = null;
  const saver = {
    hasPending: () => false,
    clearCompleted: () => { completed = null; },
    async save(id, cityId, value) {
      if (!completed) {
        submitted.push({ id, cityId, value });
        completed = { changed: true, auditId: "audit-id" };
      }
      return completed;
    },
  };
  const mocks = {
    react,
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@/lib/supabase/client": { createBrowserClient: () => fakeReadClient(object) },
    "@/hooks/useCivicObjectMutation": { useCivicEdit: () => ({
      actions: { canEdit: true }, busy: false, unconfirmed: false, error: null, message: null,
      save: async () => {}, saveLinks: async (save) => { try { await save(); } catch {} }, transition() {},
    }) },
    "@/lib/admin/civicObjectClient": {
      ...client,
      saveCivicRelationships: async () => { graphCalls++; if (graphCalls === 1) throw new Error("graph failed"); },
    },
    "@/lib/moments/relationshipClient": { createMomentRelationshipSaver: () => saver },
    "@/hooks/useLoadMomentInitial": { useLoadMomentInitial: () => ({ loading: false, initialData: {
      cityId: "city-id", moment: object, momentRelationships: momentSnapshot, relationshipsLoaded: true,
      relationships: [], events: [], entities: [], artifacts: [], stories: [],
    } }) },
    "@/hooks/useMomentState": { useMomentState: () => stateFields },
  };
  for (const [name, component] of Object.entries(stubs)) {
    const folder = name === "RelationshipSelector" ? "relationships" : name === "CivicLifecycleControls" ? "admin" : "moments";
    mocks[`@/components/${folder}/${name}`] = { __esModule: true, default: component };
  }
  const page = load("app/[citySlug]/moments/[momentSlug]/edit/page.tsx", mocks).default;
  const render = () => { react.begin(); const tree = page({ params: { citySlug: "seattle", momentSlug: "moment" } }); return tree.type(tree.props); };
  await find(render(), (node) => node.type === "button" && node.props.children === "Save Relationships").props.onClick();
  const afterFailure = render();
  assert.ok(find(afterFailure, (node) => node.type === "p" && String(node.props.children).includes("Audit ID: audit-id")));
  await find(afterFailure, (node) => node.type === "button" && node.props.children === "Save Relationships").props.onClick();
  assert.equal(submitted.length, 1);
  assert.equal(graphCalls, 2);
  assert.deepEqual(submitted[0].value, {
    entities: momentSnapshot.entities, stories: momentSnapshot.stories,
    eras: [{ id: "new-era" }], places: [{ id: "new-place" }], neighborhoods: [{ id: "new-neighborhood" }],
  });
});

test("Moment loader disables relationship saves when the complete snapshot cannot be read", async () => {
  const react = fakeReact();
  const object = { id: "moment-id", city_id: "city-id" };
  const hooks = load("hooks/useLoadMomentInitial.ts", {
    react,
    "@/lib/supabase/client": { createBrowserClient: () => fakeReadClient(object) },
    "@/lib/moments/relationshipClient": { loadMomentRelationships: async () => { throw new Error("snapshot unavailable"); } },
  });
  const render = () => { react.begin(); return hooks.useLoadMomentInitial("seattle", "moment"); };
  render();
  await new Promise((resolve) => setImmediate(resolve));
  const result = render();
  assert.equal(result.initialData.relationshipsLoaded, false);
  assert.equal(result.initialData.momentRelationships, null);
  assert.match(result.initialData.relationshipsError, /snapshot unavailable/);
});

test("failed or ambiguous civic requests are not reported as success", async (t) => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  global.fetch = async () => { throw new Error("offline"); };
  await assert.rejects(client.civicRequest("/test"), (error) => error.unconfirmed);
  global.fetch = async () => new Response("not JSON", { status: 500 });
  await assert.rejects(client.civicRequest("/test"), (error) => error.unconfirmed && error.message.includes("unconfirmed"));
  global.fetch = async () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  await assert.rejects(client.civicRequest("/test"), (error) => !error.unconfirmed && error.message === "Forbidden");
});

test("unconfirmed creation blocks retry until the operator verifies the record", async () => {
  const react = fakeReact();
  let requests = 0;
  const hooks = load("hooks/useCivicObjectMutation.ts", {
    react,
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@/lib/admin/civicObjectClient": {
      ...client,
      civicRequest: async () => {
        requests++;
        throw new client.CivicRequestError("Outcome unconfirmed. Verify before retrying.", true);
      },
    },
  });
  const render = () => { react.begin(); return hooks.useCivicCreate("event", "seattle", "events"); };
  await render().create({ name: "test" });
  const state = render();
  assert.equal(state.unconfirmed, true);
  assert.match(state.error, /unconfirmed/);
  await state.create({ name: "test" });
  assert.equal(requests, 1);
});

test("lifecycle controls expose only the actions supplied by the service", () => {
  const Controls = load("components/admin/CivicLifecycleControls.tsx").default;
  for (const [action, expected] of [["canApprove", "Approve"], ["canHide", "Hide"], ["canRestore", "Restore to Pending"]]) {
    const actions = {
      status: "pending", isPublished: false, canEdit: true,
      canApprove: false, canHide: false, canRestore: false, [action]: true,
    };
    const tree = Controls({ actions, busy: false, unconfirmed: false, transition() {} });
    assert.ok(find(tree, (node) => node.type === "button" && node.props.children === expected));
    for (const other of ["Approve", "Hide", "Restore to Pending"].filter((label) => label !== expected)) {
      assert.equal(find(tree, (node) => node.type === "button" && node.props.children === other), undefined);
    }
  }
});

function fakeLinkClient(deleteError, insertError) {
  const calls = [];
  return {
    calls,
    from(table) {
      return {
        delete() {
          calls.push(["delete", table]);
          return {
            eq(column, value) {
              calls.push([column, value]);
              return column === "from_type" ? this : Promise.resolve({ error: deleteError });
            },
          };
        },
        async insert(rows) { calls.push(["insert", table, rows]); return { error: insertError }; },
      };
    },
  };
}

test("relationship and link writes use the returned ID and surface delete and insert failures", async () => {
  const rels = [{ from_type: "moment", from_id: null, to_type: "event", to_id: "target" }];
  const supabase = fakeLinkClient(null, null);
  await client.saveCivicRelationships(supabase, "moment", "source", rels);
  assert.deepEqual(supabase.calls.at(-1), ["insert", "civic_relationships", [
    { from_type: "moment", from_id: "source", to_type: "event", to_id: "target" },
  ]]);
  const failingDelete = fakeLinkClient(new Error("delete failed"), null);
  await assert.rejects(client.saveCivicLinks(failingDelete, "moment_places", "moment_id", "place_id", "source", ["target"]), /delete failed/);
  assert.equal(failingDelete.calls.length, 2);
  const failingInsert = fakeLinkClient(null, new Error("insert failed"));
  await assert.rejects(client.saveCivicRelationships(failingInsert, "moment", "source", rels), /insert failed/);
  const momentLinks = fakeLinkClient(null, null);
  await client.saveCivicLinks(momentLinks, "moment_places", "moment_id", "place_id", "source", ["target"]);
  const row = momentLinks.calls.at(-1)[2][0];
  assert.match(row.id, /^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  assert.equal(row.moment_id, "source");
  assert.equal(row.place_id, "target");
});

for (const type of types) {
  test(`${type}: create retries links without a second create; edit and lifecycle use correct endpoints`, async (t) => {
    const react = fakeReact();
    const requests = [];
    const pushes = [];
    let status = "pending";
    const actions = () => ({
      status, isPublished: status === "approved", canEdit: true,
      canApprove: status === "pending", canHide: status === "approved", canRestore: status === "hidden",
    });
    const mocks = {
      react,
      "next/navigation": { useRouter: () => ({ push: (url) => pushes.push(url) }) },
      "@/lib/admin/civicObjectClient": {
        ...client,
        civicRequest: async (url, init) => {
          requests.push({ url, init });
          if (!init) return { actions: actions() };
          if (url.endsWith("/approve")) status = "approved";
          if (url.endsWith("/hide")) status = "hidden";
          if (url.endsWith("/restore")) status = "pending";
          return { result: { [`${type}Id`]: "object-id", auditId: "audit-id" } };
        },
      },
    };
    const hooks = load("hooks/useCivicObjectMutation.ts", mocks);
    const renderCreate = () => { react.begin(); return hooks.useCivicCreate(type, "seattle", `${type}s`); };
    let links = 0;
    await renderCreate().create({ name: "test" }, async (id) => {
      assert.equal(id, "object-id");
      links++;
      throw new Error("links failed");
    });
    let create = renderCreate();
    assert.equal(create.createdId, "object-id");
    assert.match(create.error, /Record created/);
    await create.create({ name: "changed" }, async (id) => { assert.equal(id, "object-id"); links++; });
    assert.equal(requests.filter((r) => r.init?.method === "POST").length, 1);
    assert.equal(links, 2);
    assert.equal(requests[0].url, `/api/admin/civic-objects/${type}`);
    assert.equal(JSON.parse(requests[0].init.body).citySlug, "seattle");

    const editReact = fakeReact();
    mocks.react = editReact;
    const editHooks = load("hooks/useCivicObjectMutation.ts", mocks);
    const renderEdit = () => { editReact.begin(); return editHooks.useCivicEdit(type, "object-id", "seattle", `${type}s`); };
    const originalConfirm = global.confirm;
    global.confirm = () => true;
    t.after(() => { global.confirm = originalConfirm; });
    renderEdit();
    await new Promise((resolve) => setImmediate(resolve));
    let edit = renderEdit();
    assert.equal(edit.actions.canApprove, true);
    await edit.transition("approve");
    edit = renderEdit();
    assert.equal(edit.actions.canHide, true);
    await edit.transition("hide");
    edit = renderEdit();
    assert.equal(edit.actions.canRestore, true);
    await edit.transition("restore");
    edit = renderEdit();
    await edit.save({ description: "metadata" });
    const mutations = requests.filter((r) => r.init && r.url.includes("/object-id"));
    assert.deepEqual(mutations.map((r) => [r.init.method, r.url.split("/").at(-1)]), [
      ["POST", "approve"], ["POST", "hide"], ["POST", "restore"], ["PATCH", "object-id"],
    ]);
    assert.deepEqual(JSON.parse(mutations.at(-1).init.body), { description: "metadata" });
    assert.ok(pushes.length >= 2);
  });
}
