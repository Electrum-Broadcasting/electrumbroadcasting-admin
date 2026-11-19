"use client";

import { useCallback, useEffect, useState } from "react";

type Hotspot = {
  id: string;
  label: string;
  pan_x: number;
  pan_y: number;
  target_type: string;
  target_id: string | null;
  target_url: string | null;
  is_active: boolean;
};

type Editor = Omit<Hotspot, "id" | "is_active"> & { id?: string };
const types = [
  ["civic_entity", "Entity"], ["civic_event", "Event"], ["civic_artifact", "Artifact"],
  ["civic_place", "Place"], ["civic_neighborhood", "Neighborhood"], ["civic_moment", "Moment"],
  ["civic_story", "Story"], ["external_url", "External URL"],
];

export default function HotspotManager({ endpoint, imageUrl, panoramaStatus }: {
  endpoint: string; imageUrl: string; panoramaStatus: string;
}) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [search, setSearch] = useState("");
  const [targets, setTargets] = useState<{ id: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.hotspots)) throw new Error(body.error || "Unable to load hotspots.");
      setHotspots(body.hotspots);
      setBlocked(false);
      setError(null);
    } catch (reason) {
      console.error("Hotspot list failed:", reason);
      setBlocked(true);
      setError(reason instanceof Error ? reason.message : "Unable to load hotspots.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  async function searchTargets() {
    if (!editor) return;
    setBusy(true);
    setError(null);
    setTargets([]);
    try {
      const query = new URLSearchParams({ targetType: editor.target_type, search });
      const response = await fetch(`${endpoint}?${query}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.targets)) throw new Error(body.error || "Target search failed.");
      setTargets(body.targets);
      if (!body.targets.length) setMessage("No matching published targets found.");
      else setMessage(null);
    } catch (reason) {
      console.error("Hotspot target search failed:", reason);
      setError(reason instanceof Error ? reason.message : "Target search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function validateSelection(selection: Editor | null) {
    if (!selection) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "validate", data: selection }),
      });
      const body = await response.json();
      if (!response.ok || body.result?.valid !== true) throw new Error(body.error || "Target validation failed.");
      setMessage(selection.target_type === "external_url"
        ? "HTTPS URL format is valid. Destination availability is not checked."
        : "Target meets the public page eligibility rules for this city. Public delivery is not verified.");
    } catch (reason) {
      console.error("Hotspot target validation failed:", reason);
      setError(reason instanceof Error ? reason.message : "Target validation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(payload: Record<string, unknown>) {
    if (busy || blocked) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      let body;
      try {
        body = await response.json();
      } catch {
        throw new Error("Request outcome is unconfirmed. Reload hotspots and verify before retrying.");
      }
      if (!response.ok) {
        if (response.status >= 500) setBlocked(true);
        setError(body.error || "Hotspot operation failed.");
        return;
      }
      if (typeof body.result?.id !== "string" || typeof body.result?.audit_id !== "string") {
        throw new Error("Request outcome is unconfirmed. Reload hotspots and verify before retrying.");
      }
      setMessage(`Saved. Audit ID: ${body.result.audit_id}`);
      setEditor(null);
      setTargets([]);
      await load();
    } catch (reason) {
      console.error("Hotspot request outcome unknown:", reason);
      setBlocked(true);
      setError(reason instanceof Error ? reason.message : "Request outcome is unconfirmed. Reload and verify before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border rounded p-4 space-y-3">
      <h3 className="font-semibold">Hotspots</h3>
      <p>Draft and deactivated hotspots are both stored as inactive. Public traversal is not yet available.</p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button type="button" disabled={busy} onClick={() => void load()}>Reload hotspots</button>
      {loading ? <p>Loading hotspots…</p> : !blocked && <>
        <ul className="space-y-2">
          {hotspots.map((item) => <li key={item.id} className="border p-2 space-y-1">
            <p>{item.label} · {item.is_active ? "Active" : "Inactive"} · {item.target_type}</p>
            <p className="break-all">Target: {item.target_url ?? item.target_id} · UV: {item.pan_x}, {item.pan_y}</p>
            <div className="flex gap-4">
              <button type="button" disabled={busy} onClick={() => { setEditor({ ...item }); setTargets([]); setSearch(""); }}>Edit</button>
              <button type="button" disabled={busy || (!item.is_active && panoramaStatus === "archived")} onClick={() => void mutate({
                operation: item.is_active ? "deactivate" : "activate", id: item.id,
              })}>{item.is_active ? "Deactivate" : "Activate"}</button>
              <button type="button" disabled={busy} onClick={() => {
                if (confirm("Delete this hotspot?")) void mutate({ operation: "delete", id: item.id });
              }}>Delete</button>
            </div>
          </li>)}
        </ul>
        {!hotspots.length && <p>No hotspots.</p>}
        <button type="button" disabled={busy || panoramaStatus === "archived"} onClick={() => {
          setTargets([]); setSearch("");
          setEditor({ label: "", pan_x: 0.5, pan_y: 0.5, target_type: "civic_place", target_id: null, target_url: null });
        }}>Add hotspot</button>
      </>}
      {editor && <fieldset disabled={busy || blocked || loading} className="border rounded p-3 space-y-3">
        <legend>{editor.id ? "Edit hotspot" : "Place hotspot"}</legend>
        <p>Click the flat panorama to place the marker, or enter exact normalized coordinates.</p>
        <div className="relative cursor-crosshair" onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (busy || blocked || loading || !bounds.width || !bounds.height) return;
          const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
          const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
          setEditor({ ...editor, pan_x: Number(x.toFixed(4)), pan_y: Number(y.toFixed(4)) });
        }}>
          <img src={imageUrl} alt="Flat panorama placement surface" className="block w-full" />
          <span aria-hidden="true" className="absolute w-4 h-4 rounded-full bg-red-600 border-2 border-white pointer-events-none"
            style={{ left: `${editor.pan_x * 100}%`, top: `${editor.pan_y * 100}%`, transform: "translate(-50%, -50%)" }} />
        </div>
        <label className="block">Label <input className="border p-1" maxLength={120} value={editor.label} onChange={(e) => setEditor({ ...editor, label: e.target.value })} /></label>
        <label className="block">Horizontal UV <input className="border p-1" type="number" min="0" max="1" step="0.0001" value={editor.pan_x} onChange={(e) => setEditor({ ...editor, pan_x: e.target.valueAsNumber })} /></label>
        <label className="block">Vertical UV <input className="border p-1" type="number" min="0" max="1" step="0.0001" value={editor.pan_y} onChange={(e) => setEditor({ ...editor, pan_y: e.target.valueAsNumber })} /></label>
        <label className="block">Target type <select className="border p-1" value={editor.target_type} onChange={(e) => {
          setEditor({ ...editor, target_type: e.target.value, target_id: null, target_url: null }); setTargets([]); setSearch(""); setMessage(null);
        }}>
          {editor.target_type === "panorama" && <option value="panorama" disabled>Panorama (unsupported)</option>}
          {types.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
        </select></label>
        {editor.target_type === "external_url" ? <label className="block">HTTPS URL <input className="border p-1 w-full" type="url" value={editor.target_url ?? ""} onChange={(e) => { setMessage(null); setEditor({ ...editor, target_url: e.target.value }); }} /></label> :
          <div className="space-y-2">
            <label className="block">Search published targets <input className="border p-1" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <button type="button" onClick={() => void searchTargets()}>Search</button>
            <ul>{targets.map((target) => <li key={target.id}><button type="button" onClick={() => {
              const selection = { ...editor, target_id: target.id };
              setMessage(null); setEditor(selection); void validateSelection(selection);
            }}>{target.label} · {target.id}</button></li>)}</ul>
            <label className="block">Selected target ID <input className="border p-1 w-full" value={editor.target_id ?? ""} onChange={(e) => { setMessage(null); setEditor({ ...editor, target_id: e.target.value }); }} /></label>
          </div>}
        <button type="button" onClick={() => void validateSelection(editor)}>Validate target</button>{" "}
        <button type="button" onClick={() => void mutate({
          operation: editor.id ? "update" : "place", ...(editor.id ? { id: editor.id } : {}), data: editor,
        })}>Save hotspot</button>{" "}
        <button type="button" onClick={() => setEditor(null)}>Cancel</button>
      </fieldset>}
    </section>
  );
}
