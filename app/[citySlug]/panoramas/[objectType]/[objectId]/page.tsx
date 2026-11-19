"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Panorama = {
  id: string;
  city_id: string;
  civic_object_type: string;
  civic_object_id: string;
  label: string;
  description: string | null;
  status: string;
  display_order: number;
  equirectangular_url: string;
  pan_x_initial: number;
  pan_y_initial: number;
  created_at: string | null;
};

function PanoramaPreview({ panorama }: { panorama: Panorama }) {
  const [unavailable, setUnavailable] = useState(false);
  if (unavailable) return <p role="status">Preview unavailable. Check the image URL.</p>;
  return <img src={panorama.equirectangular_url} alt={`Equirectangular preview of ${panorama.label}`} className="w-full" onError={() => setUnavailable(true)} />;
}

export default function PanoramaManager({ params }: {
  params: { citySlug: string; objectType: string; objectId: string };
}) {
  const endpoint = `/api/admin/civic-objects/${encodeURIComponent(params.objectType)}/${encodeURIComponent(params.objectId)}/panoramas`;
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [selected, setSelected] = useState<Panorama | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
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
      if (!response.ok || !Array.isArray(body.panoramas)) throw new Error(body.error || "Unable to load panoramas.");
      setPanoramas(body.panoramas);
      setSelected(null);
      setBlocked(false);
      setError(null);
    } catch (reason) {
      console.error("Panorama list failed:", reason);
      setBlocked(true);
      setError(reason instanceof Error ? reason.message : "Unable to load panoramas.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  async function submit(method: "POST" | "PATCH", body: FormData | Record<string, unknown>) {
    if (busy || blocked) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    let response: Response;
    let result: { error?: string; result?: { audit_id?: string; changed?: number } } | null;
    try {
      response = await fetch(endpoint, {
        method, ...(body instanceof FormData ? { body } : {
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        }),
      });
      result = await response.json();
    } catch (reason) {
      console.error("Panorama request outcome unknown:", reason);
      setError("Request outcome is unconfirmed. Reload the panorama list and verify before retrying.");
      setBlocked(true);
      setBusy(false);
      return;
    }
    if (!response.ok) {
      setError(result?.error || "Panorama operation failed.");
      if (response.status >= 500) setBlocked(true);
      setBusy(false);
      return;
    }
    const reordered = !(body instanceof FormData) && body.operation === "reorder";
    const confirmation = result?.result;
    if (!confirmation || (reordered
      ? typeof confirmation.changed !== "number" || !Number.isInteger(confirmation.changed) || confirmation.changed < 0
      : typeof confirmation.audit_id !== "string" || !confirmation.audit_id)) {
      setError("Request outcome is unconfirmed. Reload the panorama list and verify before retrying.");
      setBlocked(true);
      setBusy(false);
      return;
    }
    setMessage(reordered ? `Reordered ${confirmation.changed} panoramas.` : `Saved. Audit ID: ${confirmation.audit_id}`);
    if (method === "POST") {
      setFile(null);
      setTitle("");
      setDetails("");
      if (fileInput.current) fileInput.current.value = "";
    }
    await load();
    setBusy(false);
  }

  async function upload() {
    if (!file) { setError("Select an image."); return; }
    const form = new FormData();
    form.set("file", file);
    form.set("label", title);
    form.set("description", details);
    await submit("POST", form);
  }

  async function reorder(id: string, delta: number) {
    const ordered = panoramas.filter((item) => item.status !== "archived");
    const index = ordered.findIndex((item) => item.id === id);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= ordered.length) return;
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    await submit("PATCH", { operation: "reorder", ids: ordered.map((item) => item.id) });
  }

  return (
    <main className="p-6 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Panoramas</h1>
      <p>Parent: {params.objectType} · {params.objectId}</p>
      <p>JPEG or WebP, exact 2:1, 2048 × 1024 to 8192 × 4096 pixels, maximum 50 MiB.</p>
      <p>Draft image URLs are public to anyone who has the link.</p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button type="button" onClick={() => void load()} disabled={busy}>Reload panoramas</button>
      <fieldset disabled={busy || blocked || loading} className="border rounded p-4 space-y-3">
        <legend>Upload panorama</legend>
        <label className="block">Title <input className="border p-2" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></label>
        <label className="block">Description <textarea className="border p-2" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} /></label>
        <label className="block">Image <input ref={fileInput} type="file" accept="image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
        <button type="button" onClick={() => void upload()}>Upload draft</button>
      </fieldset>
      {loading ? <p>Loading panoramas…</p> : blocked ? null : panoramas.length === 0 ? <p>No panoramas.</p> : (
        <ol className="space-y-4">
          {panoramas.map((item) => (
            <li key={item.id} className="border rounded p-4 space-y-2">
              <h2 className="font-semibold">{item.label}</h2>
              <p>Status: {item.status} · Order: {item.display_order} · Created: {item.created_at || "Unknown"}</p>
              <p>Parent: {item.civic_object_type} · {item.civic_object_id}</p>
              <p className="break-all">URL: <a href={item.equirectangular_url} target="_blank" rel="noreferrer">{item.equirectangular_url}</a></p>
              <PanoramaPreview panorama={item} />
              <div className="flex gap-4">
                {item.status !== "archived" && <>
                  <button disabled={busy || blocked} onClick={() => setSelected({ ...item })}>Edit</button>
                  <button disabled={busy || blocked} onClick={() => void reorder(item.id, -1)}>Move up</button>
                  <button disabled={busy || blocked} onClick={() => void reorder(item.id, 1)}>Move down</button>
                  {item.status === "draft" && <button disabled={busy || blocked} onClick={() => void submit("PATCH", { operation: "publish", id: item.id })}>Publish</button>}
                  {item.status === "published" && <button disabled={busy || blocked} onClick={() => void submit("PATCH", { operation: "unpublish", id: item.id })}>Unpublish</button>}
                  <button disabled={busy || blocked} onClick={() => {
                    if (confirm("Archive this panorama? It cannot be republished.")) void submit("PATCH", { operation: "archive", id: item.id });
                  }}>Archive</button>
                </>}
              </div>
            </li>
          ))}
        </ol>
      )}
      {selected && <fieldset disabled={busy || blocked} className="border rounded p-4 space-y-2">
        <legend>Edit panorama</legend>
        <label className="block">Title <input className="border p-2" value={selected.label} onChange={(e) => setSelected({ ...selected, label: e.target.value })} maxLength={120} /></label>
        <label className="block">Description <textarea className="border p-2" value={selected.description ?? ""} onChange={(e) => setSelected({ ...selected, description: e.target.value })} maxLength={500} /></label>
        <label className="block">Initial horizontal UV <input type="number" min="0" max="1" step="0.0001" value={selected.pan_x_initial} onChange={(e) => setSelected({ ...selected, pan_x_initial: e.target.valueAsNumber })} /></label>
        <label className="block">Initial vertical UV <input type="number" min="0" max="1" step="0.0001" value={selected.pan_y_initial} onChange={(e) => setSelected({ ...selected, pan_y_initial: e.target.valueAsNumber })} /></label>
        <button type="button" onClick={() => void submit("PATCH", {
          operation: "metadata", id: selected.id, data: {
            label: selected.label, description: selected.description,
            pan_x_initial: selected.pan_x_initial, pan_y_initial: selected.pan_y_initial,
          },
        })}>Save metadata</button>
        <button type="button" onClick={() => setSelected(null)}>Cancel</button>
      </fieldset>}
    </main>
  );
}
