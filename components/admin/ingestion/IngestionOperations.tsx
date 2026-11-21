"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Database, MapPin, Plus, RefreshCw, Upload } from "lucide-react";
import type { Polygon, MultiPolygon } from "geojson";
import type { AdminRole } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { QueryMap, type QueryBox } from "./QueryMap";
import { BoundaryPreparationDialog } from "./BoundaryPreparationDialog";

type City = { id: string; name: string; slug: string };
type Boundary = { id: string; source_url: string; source_version: string; geometry: Polygon | MultiPolygon; registered_at: string; registered_by: string | null };
type BoundaryPreparationSummary = {
  id: string;
  source_url: string;
  source_version: string;
  source_coordinate_count: number;
  prepared_coordinate_count: number | null;
  status: "uploaded" | "prepared" | "approved" | "rejected" | "registered";
  created_at: string;
  approved_at: string | null;
  registered_at: string | null;
  created_by: string | null;
  approved_by: string | null;
  registered_boundary_id: string | null;
  rejection_reason: string | null;
};
type Item = { external_id: string; state: string; disposition: string; audit_id: string; place_id: string | null; name: string | null; slug: string | null; category: string | null; place_status: string | null; is_published: boolean | null };
type Batch = { id: string; boundary_id: string; source: string; source_version: string; started_at: string; status: string; error: string | null; audit_id: string | null; items: Item[] };
type Data = { boundaries: Boundary[]; batches: Batch[] };
type Tab = "run" | "boundaries" | "history" | "review";
const tabs: { id: Tab; label: string }[] = [
  { id: "run", label: "Run Import" }, { id: "boundaries", label: "Boundary Registry" },
  { id: "history", label: "Import History" }, { id: "review", label: "Candidate Review" },
];
const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
const date = (value: string) => new Date(value).toLocaleString();
const counts = (batch: Batch, state: string) => batch.items.filter((item) => item.state === state).length;
const preparationStatusClass: Record<BoundaryPreparationSummary["status"], string> = {
  uploaded: "border-sky-300 bg-sky-50 text-sky-900",
  prepared: "border-amber-300 bg-amber-50 text-amber-900",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-900",
  rejected: "border-red-300 bg-red-50 text-red-900",
  registered: "border-border bg-muted text-foreground",
};

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

export function IngestionOperations({ role }: { role: AdminRole }) {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [preparations, setPreparations] = useState<BoundaryPreparationSummary[]>([]);
  const [preparationsLoading, setPreparationsLoading] = useState(false);
  const [preparationsError, setPreparationsError] = useState("");
  const [tab, setTab] = useState<Tab>("run");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [preparingBoundary, setPreparingBoundary] = useState(false);
  const [initialPreparationId, setInitialPreparationId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [box, setBox] = useState<QueryBox | null>(null);
  const [drawing, setDrawing] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<{ created: number; duplicate: number; quarantined: number } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const city = cities.find((item) => item.id === cityId);
  const boundary = data?.boundaries[0];
  const batch = data?.batches.find((item) => item.id === selectedBatch);

  useEffect(() => {
    request("/api/admin/ingestion/operations").then((result) => {
      setCities(result.cities); setCityId(result.cities[0]?.id || "");
      if (!result.cities.length) setLoading(false);
    }).catch((failure) => { setError(failure.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!cityId) return;
    let active = true;
    setLoading(true); setData(null); setBox(null); setSelectedBatch(null);
    request(`/api/admin/ingestion/operations?city_id=${encodeURIComponent(cityId)}`).then((result) => {
      if (active) { setData(result.result); setLoading(false); }
    }).catch((failure) => { if (active) { setError(failure.message); setLoading(false); } });
    return () => { active = false; };
  }, [cityId, refresh]);

  useEffect(() => {
    if (!cityId || tab !== "boundaries") return;
    let active = true;
    setPreparationsLoading(true);
    setPreparationsError("");
    request(`/api/admin/ingestion/boundary-preparations?city_id=${encodeURIComponent(cityId)}`).then((result) => {
      if (active) setPreparations(result.preparations);
    }).catch((failure) => {
      if (active) setPreparationsError(failure instanceof Error ? failure.message : "Unable to load preparations");
    }).finally(() => {
      if (active) setPreparationsLoading(false);
    });
    return () => { active = false; };
  }, [cityId, refresh, tab]);

  const changeBox = useCallback((value: QueryBox | null) => setBox(value), []);
  async function runImport() {
    if (!box || !boundary) return;
    setConfirming(false); setBusy(true); setOutcome(null); setError("");
    try {
      const result = await request("/api/admin/ingestion/osm/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city_id: cityId, boundary_id: boundary.id, source: "openstreetmap", query_box: box }) });
      setOutcome(result.counts);
    } catch (failure) { setError(`${failure instanceof Error ? failure.message : "Import failed"}. Check import history before retrying.`); }
    finally { setBusy(false); setRefresh((value) => value + 1); }
  }
  async function review(placeId: string, action: "approve" | "hide") {
    if (!window.confirm(action === "approve" ? "Approve and publish this Place?" : "Hide this Place?")) return;
    setReviewBusy(placeId); setError("");
    try { await request(`/api/admin/civic-places/${placeId}/${action}`, { method: "POST" }); setRefresh((value) => value + 1); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Review action failed"); }
    finally { setReviewBusy(null); }
  }
  async function abortBatch(batchId: string) {
    const reason = window.prompt("Only abort a run that is no longer processing. Enter a reason:");
    if (!reason?.trim()) return;
    setBusy(true); setError("");
    try {
      await request("/api/admin/ingestion/osm/runs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ batch_id: batchId, operation: "abort", reason: reason.trim() }) });
      setRefresh((value) => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to abort import"); }
    finally { setBusy(false); }
  }
  const candidates = data?.batches.flatMap((entry) => entry.items.filter((item) => item.state === "created" && item.place_status === "pending").map((item) => ({ item, entry }))) || [];
  const area = box ? Math.abs((box.north - box.south) * 111.32 * (box.east - box.west) * 111.32 * Math.cos((box.north + box.south) * Math.PI / 360)) : 0;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div><p className="text-xs font-semibold uppercase text-muted-foreground">Data Operations</p><h2 className="mt-1 text-2xl font-semibold">Ingestion</h2><p className="mt-1 text-sm text-muted-foreground">Cities, sources, imports, and review</p></div>
      <label className="text-sm font-medium">City<select className={`${field} mt-1 min-w-48`} value={cityId} onChange={(event) => { setCityId(event.target.value); setError(""); setOutcome(null); }} disabled={busy}>{cities.length === 0 && <option value="">No cities available</option>}{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </div>
    <nav className="flex gap-5 overflow-x-auto border-b border-border" aria-label="Ingestion sections">{tabs.map((item) => <button key={item.id} type="button" onClick={() => { setTab(item.id); setSelectedBatch(null); }} className={`shrink-0 border-b-2 pb-3 text-sm font-medium ${tab === item.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`} aria-current={tab === item.id ? "page" : undefined}>{item.label}</button>)}</nav>
    {error && <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error} <button type="button" className="underline" onClick={() => setError("")}>Dismiss</button></div>}
    {loading ? <p className="text-sm text-muted-foreground">Loading ingestion records...</p> : !city ? <p className="text-sm text-muted-foreground">No assigned cities are available.</p> : data && <>
      {tab === "run" && <section className="space-y-5"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-700"/><h3 className="text-lg font-semibold">Run an OpenStreetMap import</h3></div>
        {boundary ? <><div className="grid gap-4 border-y border-border py-4 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Active boundary version</p><p className="mt-1 font-medium">{boundary.source_version}</p></div><div><p className="text-muted-foreground">Registered</p><p className="mt-1 font-medium">{date(boundary.registered_at)}</p></div><div><p className="text-muted-foreground">Registered by</p><p className="mt-1 font-medium">{boundary.registered_by || "Unknown"}</p></div></div>
          <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h4 className="font-medium">Query area</h4><p className="text-sm text-muted-foreground">Drag a rectangle within the boundary extent. Zoom to select a smaller area.</p></div><div role="group" aria-label="Map mode" className="flex rounded-md border border-border"><button type="button" aria-pressed={drawing} onClick={() => setDrawing(true)} className={`px-3 py-1 text-sm ${drawing ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Draw area</button><button type="button" aria-pressed={!drawing} onClick={() => setDrawing(false)} className={`px-3 py-1 text-sm ${!drawing ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Move map</button></div></div><QueryMap geometry={boundary.geometry} drawing={drawing} onChange={changeBox}/><p className="mt-2 text-sm text-muted-foreground">{box ? `Selected area: approximately ${area.toFixed(2)} km²` : "No area selected"}</p></div>
          {outcome && <div role="status" className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">Import complete: Created {outcome.created} · Duplicates {outcome.duplicate} · Quarantined {outcome.quarantined} · Failed 0</div>}
          <Button disabled={!box || busy} onClick={() => setConfirming(true)}>{busy ? "Running..." : "Run OSM Import"}</Button>
        </> : <div className="border-y border-border py-8 text-sm text-muted-foreground">No boundary registered for {city.name}. <button className="font-medium text-primary underline" onClick={() => setTab("boundaries")}>Register a boundary</button></div>}</section>}
      {tab === "boundaries" && <section className="space-y-8"><div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Boundary Registry</h3><p className="text-sm text-muted-foreground">Registered boundaries available to ingestion</p></div><Button onClick={() => { setInitialPreparationId(undefined); setPreparingBoundary(true); }}><Plus/> Prepare Boundary</Button></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{["City", "Boundary source", "Version", "Registered by", "Registered"].map((heading) => <th className="px-3 py-3 font-medium" key={heading}>{heading}</th>)}</tr></thead><tbody>{data.boundaries.map((item) => <tr key={item.id} className="border-b border-border"><td className="px-3 py-3">{city.name}</td><td className="px-3 py-3"><a className="text-primary underline" href={item.source_url} target="_blank" rel="noreferrer">{new URL(item.source_url).hostname}</a></td><td className="px-3 py-3">{item.source_version}</td><td className="px-3 py-3">{item.registered_by || "Unknown"}</td><td className="px-3 py-3">{date(item.registered_at)}</td></tr>)}</tbody></table>{!data.boundaries.length && <p className="py-6 text-center text-sm text-muted-foreground">No registered boundaries.</p>}</div></div>
        <div className="space-y-4 border-t border-border pt-5"><div><h4 className="text-base font-semibold">Preparations</h4><p className="text-sm text-muted-foreground">Source and candidate records are operational preparations, not registered boundaries.</p></div>
          {preparationsError && <p role="alert" className="text-sm text-red-800">{preparationsError}</p>}
          {preparationsLoading ? <p className="text-sm text-muted-foreground">Loading preparations...</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{["Source", "Version", "Source coordinates", "Prepared coordinates", "Status", "Prepared by", "Approved by", "Updated"].map((heading) => <th className="px-3 py-3 font-medium" key={heading}>{heading}</th>)}</tr></thead><tbody>{preparations.map((item) => <tr key={item.id} className="border-b border-border"><td className="px-3 py-3"><a className="text-primary underline" href={item.source_url} target="_blank" rel="noreferrer">{new URL(item.source_url).hostname}</a></td><td className="px-3 py-3"><button type="button" className="text-primary underline" onClick={() => { setInitialPreparationId(item.id); setPreparingBoundary(true); }}>{item.source_version}</button></td><td className="px-3 py-3">{item.source_coordinate_count.toLocaleString()}</td><td className="px-3 py-3">{item.prepared_coordinate_count?.toLocaleString() ?? "-"}</td><td className="px-3 py-3"><span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${preparationStatusClass[item.status]}`}>{item.status}</span>{item.status === "rejected" && item.rejection_reason && <p className="mt-1 max-w-56 text-xs text-muted-foreground">{item.rejection_reason}</p>}{item.status === "registered" && <p className="mt-1 text-xs text-muted-foreground">Registered in boundary inventory</p>}</td><td className="px-3 py-3">{item.created_by || "-"}</td><td className="px-3 py-3">{item.approved_by || "-"}</td><td className="px-3 py-3">{date(item.registered_at || item.approved_at || item.created_at)}</td></tr>)}</tbody></table>{!preparations.length && !preparationsError && <p className="py-6 text-center text-sm text-muted-foreground">No boundary preparations.</p>}</div>}
        </div></section>}
      {tab === "history" && <section className="space-y-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Import History</h3><p className="text-sm text-muted-foreground">Runs for {city.name}</p></div><Button variant="outline" onClick={() => setRefresh((value) => value + 1)}><RefreshCw/> Refresh</Button></div>
        {batch ? <div className="space-y-4"><button className="text-sm text-primary underline" onClick={() => setSelectedBatch(null)}>Back to history</button><h4 className="font-semibold">Batch Detail</h4><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Batch ID</dt><dd className="break-all">{batch.id}</dd></div><div><dt className="text-muted-foreground">Audit ID</dt><dd className="break-all">{batch.audit_id || "Unavailable"}</dd></div><div><dt className="text-muted-foreground">Boundary version</dt><dd>{data.boundaries.find((item) => item.id === batch.boundary_id)?.source_version || "Unavailable"}</dd></div><div><dt className="text-muted-foreground">Source version</dt><dd>{batch.source_version}</dd></div></dl>{batch.error && <p className="text-sm text-red-700">{batch.error}</p>}{batch.status === "running" && <Button variant="outline" disabled={busy} onClick={() => abortBatch(batch.id)}>Abort interrupted run</Button>}<h5 className="font-medium">Imported items</h5><div className="divide-y divide-border">{batch.items.map((item) => <div key={item.external_id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{item.name || item.external_id} <span className="text-muted-foreground">· {item.external_id}</span></span><span>{item.state} {item.disposition && `· ${item.disposition}`} {item.slug && <Link className="ml-2 text-primary underline" href={`/${city.slug}/places/${item.slug}/edit`}>Open Place</Link>}</span></div>)}{!batch.items.length && <p className="py-4 text-sm text-muted-foreground">No items recorded.</p>}</div></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{["Date", "City", "Source", "Created", "Duplicate", "Quarantine", "Status"].map((heading) => <th className="px-3 py-3 font-medium" key={heading}>{heading}</th>)}</tr></thead><tbody>{data.batches.map((item) => <tr key={item.id} className="border-b border-border"><td className="px-3 py-3"><button className="text-primary underline" onClick={() => setSelectedBatch(item.id)}>{date(item.started_at)}</button></td><td className="px-3 py-3">{city.name}</td><td className="px-3 py-3">OpenStreetMap</td><td className="px-3 py-3">{counts(item, "created")}</td><td className="px-3 py-3">{counts(item, "duplicate")}</td><td className="px-3 py-3">{counts(item, "quarantined")}</td><td className="px-3 py-3 capitalize">{item.status}</td></tr>)}</tbody></table>{!data.batches.length && <p className="py-8 text-center text-sm text-muted-foreground">No imports yet.</p>}</div>}</section>}
      {tab === "review" && <section className="space-y-4"><div><h3 className="text-lg font-semibold">Pending Imports</h3><p className="text-sm text-muted-foreground">{candidates.length} Places awaiting review</p></div><div className="flex flex-wrap gap-2"><span className="rounded border border-primary px-3 py-1 text-sm">Places</span>{["Events", "Artifacts", "Entities"].map((name) => <span key={name} className="rounded border border-border px-3 py-1 text-sm text-muted-foreground" title="Not yet available">{name} · Coming soon</span>)}</div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{["Imported Place", "Source", "External ID", "Category", "Batch", "Actions"].map((heading) => <th className="px-3 py-3 font-medium" key={heading}>{heading}</th>)}</tr></thead><tbody>{candidates.map(({ item, entry }) => <tr key={`${entry.id}-${item.external_id}`} className="border-b border-border"><td className="px-3 py-3 font-medium">{item.name}</td><td className="px-3 py-3">OpenStreetMap</td><td className="px-3 py-3">{item.external_id}</td><td className="px-3 py-3">{item.category || "Place"}</td><td className="px-3 py-3"><button className="text-primary underline" onClick={() => { setTab("history"); setSelectedBatch(entry.id); }}>{date(entry.started_at)}</button></td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{role === "CITY_ADMIN" && item.is_published === false && item.place_id && <Button size="sm" disabled={!!reviewBusy} onClick={() => review(item.place_id!, "approve")}>Approve</Button>}{item.is_published && role !== "PLATFORM_ADMIN" && item.place_id && <Button size="sm" variant="outline" disabled={!!reviewBusy} onClick={() => review(item.place_id!, "hide")}>Hide</Button>}{item.slug && <Link className="self-center text-primary underline" href={`/${city.slug}/places/${item.slug}/edit`}>Open Object</Link>}</div></td></tr>)}</tbody></table>{!candidates.length && <p className="py-8 text-center text-sm text-muted-foreground">No pending imported Places.</p>}</div></section>}
    </>}
    {confirming && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-md bg-background p-6 shadow-xl"><Database className="h-5 w-5 text-emerald-700"/><h3 id="confirm-title" className="mt-3 text-lg font-semibold">Confirm import</h3><dl className="my-5 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt>City</dt><dd>{city?.name}</dd></div><div className="flex justify-between gap-3"><dt>Estimated area</dt><dd>{area.toFixed(2)} km²</dd></div><div className="flex justify-between gap-3"><dt>Source</dt><dd>OpenStreetMap</dd></div><div className="flex justify-between gap-3"><dt>Result limit</dt><dd>Maximum 50</dd></div></dl><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button><Button onClick={runImport}>Run import</Button></div></div></div>}
    {preparingBoundary && city && <BoundaryPreparationDialog city={{ id: city.id, name: city.name }} initialPreparationId={initialPreparationId} onClose={() => setPreparingBoundary(false)} onRegistered={() => setRefresh((value) => value + 1)} />}
  </div>;
}