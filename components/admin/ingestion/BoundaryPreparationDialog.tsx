"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileUp, ShieldCheck, X } from "lucide-react";
import type { Polygon, MultiPolygon } from "geojson";
import { Button } from "@/components/ui/button";
import { BoundaryCompareMap } from "./BoundaryCompareMap";

type Geometry = Polygon | MultiPolygon;
type Preparation = {
  id: string;
  city_id: string;
  source_url: string;
  source_version: string;
  source_hash: string;
  source_geometry?: Geometry;
  source_coordinate_count: number;
  source_size_bytes: number;
  source_ring_count: number;
  source_analysis: { projection?: string };
  prepared_geometry?: Geometry | null;
  prepared_hash?: string | null;
  prepared_coordinate_count?: number | null;
  prepared_size_bytes?: number | null;
  prepared_version?: number | null;
  current_candidate_id?: string | null;
  candidates?: Array<{ id: string; version: number; geometry_hash: string; coordinate_count: number; size_bytes: number; metadata: { tolerance_meters?: number; area_delta_percent?: number }; created_by: string | null; created_at: string }>;
  preparation_metadata?: {
    algorithm?: string;
    algorithm_version?: string;
    projection?: string;
    tolerance_meters?: number;
    reduction_percent?: number;
    area_delta_percent?: number;
    validation_passed?: boolean;
    registration_eligible?: boolean;
    containment?: {
      grid_points: number;
      grid_differences: number;
      interior_points: number;
      interior_differences: number;
      exterior_points: number;
      exterior_differences: number;
      boundary_probe_points: number;
      boundary_differences: number;
      boundary_differences_by_offset_meters: Record<string, number>;
    };
  } | null;
  status: "uploaded" | "prepared" | "approved" | "rejected" | "registered";
  created_at: string;
  created_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  registered_at?: string | null;
  registered_boundary_id?: string | null;
  rejection_reason?: string | null;
};

const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
const boundaryTolerancesMeters = [0.1, 0.5, 1, 2, 5, 10] as const;
const sizes = (bytes: number) => bytes < 1000 * 1000 ? `${(bytes / 1000).toFixed(1)} KB` : `${(bytes / 1000 / 1000).toFixed(2)} MB`;
const time = (value: string) => new Date(value).toLocaleString();
const coordCount = (geometry: Geometry) => (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates)
  .flat().reduce((total, ring) => total + ring.length, 0);

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Boundary preparation request failed");
  return body;
}

export function BoundaryPreparationDialog({
  city,
  initialPreparationId,
  onClose,
  onRegistered,
}: {
  city: { id: string; name: string };
  initialPreparationId?: string;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [selected, setSelected] = useState<Preparation | null>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [preparedGeometry, setPreparedGeometry] = useState<Geometry | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceVersion, setSourceVersion] = useState("");
  const [fileName, setFileName] = useState("");
  const [tolerance, setTolerance] = useState<number>(0.1);
  const [mapMode, setMapMode] = useState<"both" | "source" | "prepared">("both");
  const [acknowledgeEdgeChanges, setAcknowledgeEdgeChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"list" | "upload" | "candidate">("list");
  const [registered, setRegistered] = useState(false);
  const sourceCoordinates = geometry ? coordCount(geometry) : selected?.source_coordinate_count ?? 0;
  const sourceBytes = geometry ? new TextEncoder().encode(JSON.stringify(geometry)).length : selected?.source_size_bytes ?? 0;
  const metadata = selected?.preparation_metadata;
  const containment = metadata?.containment;
  const sourceGeometry = geometry ?? selected?.source_geometry ?? null;
  const canApprove = !!metadata?.registration_eligible && !!containment && containment.grid_differences === 0
    && (containment.boundary_differences === 0 || acknowledgeEdgeChanges);
  const candidateSizeLabel = useMemo(() => selected?.prepared_size_bytes ? sizes(selected.prepared_size_bytes) : "", [selected?.prepared_size_bytes]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api(`/api/admin/ingestion/boundary-preparations?city_id=${encodeURIComponent(city.id)}`);
      setPreparations(result.preparations);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to load preparations"); }
    finally { setLoading(false); }
  }, [city.id]);

  useEffect(() => { void loadList(); }, [loadList]);

  function startNew() {
    setSelected(null); setGeometry(null); setPreparedGeometry(null); setSourceUrl("");
    setSourceVersion(""); setFileName(""); setError(""); setRegistered(false); setStage("upload");
  }

  const openExisting = useCallback(async (preparationId: string) => {
    setBusy(true); setError("");
    try {
      const result = await api(`/api/admin/ingestion/boundary-preparations/${preparationId}`);
      const detail = result.preparation as Preparation;
      setSelected(detail); setGeometry(null); setPreparedGeometry(detail.prepared_geometry ?? null);
      setSourceUrl(detail.source_url); setSourceVersion(detail.source_version);
      setRegistered(detail.status === "registered"); setAcknowledgeEdgeChanges(false); setStage("candidate");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to open preparation"); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (initialPreparationId) void openExisting(initialPreparationId);
  }, [initialPreparationId, openExisting]);

  async function chooseFile(file?: File) {
    setGeometry(null); setPreparedGeometry(null); setSelected(null); setFileName(""); setError("");
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Source GeoJSON exceeds the 5 MB preparation upload limit.");
      const input: unknown = JSON.parse(await file.text());
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("File must contain a GeoJSON geometry object.");
      const value = input as Record<string, unknown>;
      const candidate = value.geometry ?? input;
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)
          || !["Polygon", "MultiPolygon"].includes(String((candidate as Record<string, unknown>).type))) {
        throw new Error("Upload a Polygon or MultiPolygon geometry. FeatureCollections and other geometry types are not accepted.");
      }
      setGeometry(candidate as Geometry); setFileName(file.name);
      if (typeof value.source_url === "string") setSourceUrl(value.source_url);
      if (typeof value.source_version === "string") setSourceVersion(value.source_version);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to read GeoJSON file"); }
  }

  async function analyzeSource(event: React.FormEvent) {
    event.preventDefault(); if (!geometry) return;
    setBusy(true); setError("");
    try {
      const result = await api("/api/admin/ingestion/boundary-preparations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city_id: city.id, source_url: sourceUrl, source_version: sourceVersion, geometry }),
      });
      const detail = await api(`/api/admin/ingestion/boundary-preparations/${result.preparation_id}`);
      setSelected(detail.preparation); setStage("candidate"); await loadList();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Source analysis failed"); }
    finally { setBusy(false); }
  }

  async function registerOriginalSource() {
    if (!geometry || coordCount(geometry) > 5000 || !sourceUrl || !sourceVersion) return;
    setBusy(true); setError("");
    try {
      await api("/api/admin/ingestion/osm/boundaries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city_id: city.id, source_url: sourceUrl, source_version: sourceVersion, geometry }),
      });
      onRegistered(); onClose();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Boundary registration failed"); }
    finally { setBusy(false); }
  }

  async function generateCandidate() {
    if (!selected) return;
    setBusy(true); setError(""); setAcknowledgeEdgeChanges(false);
    try {
      const result = await api(`/api/admin/ingestion/boundary-preparations/${selected.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "prepare", tolerance_meters: tolerance }),
      });
      const detail = await api(`/api/admin/ingestion/boundary-preparations/${selected.id}`);
      setPreparedGeometry(result.geometry);
      setSelected(detail.preparation);
      await loadList();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to prepare candidate"); }
    finally { setBusy(false); }
  }

  async function action(operation: "approve" | "reject" | "register") {
    if (!selected) return;
    const body: Record<string, unknown> = { operation };
    if (operation === "approve") body.acknowledge_boundary_differences = acknowledgeEdgeChanges;
    if (operation === "reject") {
      const reason = window.prompt("Why is this prepared boundary being rejected?");
      if (!reason?.trim()) return;
      body.reason = reason.trim();
    }
    if (operation === "register" && !window.confirm(`Register the approved prepared boundary for ${city.name}?`)) return;
    setBusy(true); setError("");
    try {
      const result = await api(`/api/admin/ingestion/boundary-preparations/${selected.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (operation === "register") {
        setRegistered(true); setSelected((current) => current ? { ...current, status: "registered", registered_boundary_id: result.result.boundary_id } : current);
        onRegistered();
      } else if (operation === "approve") {
        setSelected((current) => current ? { ...current, status: "approved", approved_at: new Date().toISOString() } : current);
      } else {
        setSelected((current) => current ? { ...current, status: "rejected" } : current);
      }
      await loadList();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Boundary preparation action failed"); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-3 sm:p-6">
    <div role="dialog" aria-modal="true" aria-labelledby="preparation-title" className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-border bg-white text-black shadow-xl dark:bg-neutral-950 dark:text-white">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">Boundary Registry · {city.name}</p><h3 id="preparation-title" className="mt-1 text-xl font-semibold">Boundary Preparation</h3></div>
        <Button type="button" variant="ghost" size="icon" aria-label="Close boundary preparation" onClick={onClose}><X/></Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && <div role="alert" className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>}
        {stage === "list" && <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">Preparations</h4><p className="text-sm text-muted-foreground">Authoritative source files remain unchanged.</p></div><Button onClick={startNew}><FileUp/> Upload Source Boundary</Button></div>
          {loading ? <p className="text-sm text-muted-foreground">Loading preparations...</p> : preparations.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{["Source version", "Source coordinates", "Prepared coordinates", "Status", "Prepared by", "Approved by", "Created"].map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{preparations.map((item) => <tr key={item.id} className="border-b border-border"><td className="px-3 py-3"><button className="text-primary underline" onClick={() => void openExisting(item.id)}>{item.source_version}</button></td><td className="px-3 py-3">{item.source_coordinate_count.toLocaleString()}</td><td className="px-3 py-3">{item.prepared_coordinate_count?.toLocaleString() ?? "-"}</td><td className="px-3 py-3 capitalize">{item.status}</td><td className="px-3 py-3">{item.created_by || "-"}</td><td className="px-3 py-3">{item.approved_by || "-"}</td><td className="px-3 py-3">{time(item.created_at)}</td></tr>)}</tbody></table></div> : <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">No boundary preparations for this city.</p>}
        </section>}
        {stage === "upload" && <form className="max-w-2xl space-y-4" onSubmit={analyzeSource}>
          <div><h4 className="font-semibold">1. Upload authoritative source</h4><p className="text-sm text-muted-foreground">The original geometry is retained unchanged as the preparation source.</p></div>
          <label className="block text-sm font-medium">Source URL<input className={`${inputClass} mt-1`} type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..."/></label>
          <label className="block text-sm font-medium">Source version<input className={`${inputClass} mt-1`} required maxLength={200} value={sourceVersion} onChange={(event) => setSourceVersion(event.target.value)} placeholder="Dataset release or retrieval date"/></label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-sm" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void chooseFile(event.dataTransfer.files[0]); }}><FileUp className="h-5 w-5"/>Drop GeoJSON or choose a file<input type="file" accept=".json,.geojson,application/geo+json,application/json" className="w-full text-xs" onChange={(event) => void chooseFile(event.target.files?.[0])}/></label>
          {geometry && <p className="text-sm text-muted-foreground">{fileName} · {coordCount(geometry).toLocaleString()} coordinates · {sizes(sourceBytes)}</p>}
          <div className="flex flex-wrap justify-between gap-2"><Button type="button" variant="outline" onClick={() => setStage("list")}>Back</Button><div className="flex flex-wrap justify-end gap-2">{geometry && coordCount(geometry) <= 5000 && sourceBytes <= 900000 && <Button type="button" variant="outline" disabled={!sourceUrl || !sourceVersion || busy} onClick={() => void registerOriginalSource()}>Register Original Boundary</Button>}<Button type="submit" disabled={!geometry || !sourceUrl || !sourceVersion || busy}>{busy ? "Analyzing..." : "Analyze for Preparation"}</Button></div></div>
        </form>}
        {stage === "candidate" && selected && sourceGeometry && <section className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">2. Boundary analysis</h4><p className="text-sm text-muted-foreground">Source retained · SHA-256 {selected.source_hash.slice(0, 16)}…</p></div><span className={`rounded border px-2 py-1 text-xs ${selected.source_coordinate_count > 5000 ? "border-amber-500 text-amber-800" : "border-emerald-600 text-emerald-800"}`}>{selected.source_coordinate_count > 5000 ? "Exceeds Registration Limit" : "Within Registration Limit"}</span></div>
          <dl className="grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-4"><div><dt className="text-muted-foreground">Source coordinates</dt><dd className="mt-1 font-medium">{selected.source_coordinate_count.toLocaleString()}</dd></div><div><dt className="text-muted-foreground">Source size</dt><dd className="mt-1 font-medium">{sizes(selected.source_size_bytes)}</dd></div><div><dt className="text-muted-foreground">Rings</dt><dd className="mt-1 font-medium">{selected.source_ring_count}</dd></div><div><dt className="text-muted-foreground">Source validation</dt><dd className="mt-1 flex items-center gap-1 font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4"/> Valid</dd></div></dl>
          <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Source URL</dt><dd className="break-all"><a className="text-primary underline" href={selected.source_url} target="_blank" rel="noreferrer">{selected.source_url}</a></dd></div><div><dt className="text-muted-foreground">Source version</dt><dd>{selected.source_version}</dd></div></dl>
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h4 className="font-semibold">3. Generate prepared candidate</h4><p className="text-sm text-muted-foreground">Douglas–Peucker simplification in a local azimuthal equidistant projection.</p></div><div className="flex items-end gap-2"><label className="text-sm font-medium">Tolerance<select className={`${inputClass} mt-1 w-32`} value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} disabled={busy || selected.status === "approved" || selected.status === "rejected" || registered}>{boundaryTolerancesMeters.map((value) => <option value={value} key={value}>{value} m</option>)}</select></label><Button onClick={() => void generateCandidate()} disabled={busy || selected.status === "approved" || selected.status === "rejected" || registered}>{busy ? "Preparing..." : "Generate Candidate"}</Button></div></div>
          {metadata && preparedGeometry && <>
            <dl className="grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-5"><div><dt className="text-muted-foreground">Original</dt><dd className="mt-1 font-medium">{selected.source_coordinate_count.toLocaleString()} · {sizes(selected.source_size_bytes)}</dd></div><div><dt className="text-muted-foreground">Prepared v{selected.prepared_version ?? "-"}</dt><dd className="mt-1 font-medium">{selected.prepared_coordinate_count?.toLocaleString()} · {candidateSizeLabel}</dd></div><div><dt className="text-muted-foreground">Reduction</dt><dd className="mt-1 font-medium">{metadata.reduction_percent?.toFixed(1)}%</dd></div><div><dt className="text-muted-foreground">Area difference</dt><dd className="mt-1 font-medium">{metadata.area_delta_percent?.toFixed(5)}%</dd></div><div><dt className="text-muted-foreground">Topology</dt><dd className="mt-1 flex items-center gap-1 font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4"/> Valid</dd></div></dl>
            {selected.candidates && selected.candidates.length > 0 && <div className="space-y-2"><h5 className="text-sm font-semibold">Candidate versions</h5><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-border text-muted-foreground"><tr>{["Version", "Coordinates", "Size", "Tolerance", "Created by", "Created"].map((label) => <th key={label} className="px-2 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{selected.candidates.map((item) => <tr key={item.id} className={`border-b border-border ${item.id === selected.current_candidate_id ? "bg-muted/50 font-medium" : ""}`}><td className="px-2 py-2">v{item.version}{item.id === selected.current_candidate_id ? " · current" : ""}</td><td className="px-2 py-2">{item.coordinate_count.toLocaleString()}</td><td className="px-2 py-2">{sizes(item.size_bytes)}</td><td className="px-2 py-2">{item.metadata.tolerance_meters} m</td><td className="px-2 py-2">{item.created_by || "-"}</td><td className="px-2 py-2">{time(item.created_at)}</td></tr>)}</tbody></table></div></div>}
            <p className="break-all text-xs text-muted-foreground">{metadata.algorithm} · {metadata.algorithm_version} · {metadata.projection} · source {selected.source_hash} · prepared {selected.prepared_hash}</p>
            <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">4. Compare containment</h4><p className="text-sm text-muted-foreground">Deterministic grid plus sampled points on both sides of source edges.</p></div><div role="group" aria-label="Boundary overlay" className="flex rounded-md border border-border"><button type="button" aria-pressed={mapMode === "source"} onClick={() => setMapMode("source")} className={`px-3 py-1 text-sm ${mapMode === "source" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Original</button><button type="button" aria-pressed={mapMode === "prepared"} onClick={() => setMapMode("prepared")} className={`px-3 py-1 text-sm ${mapMode === "prepared" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Prepared</button><button type="button" aria-pressed={mapMode === "both"} onClick={() => setMapMode("both")} className={`px-3 py-1 text-sm ${mapMode === "both" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Both</button></div></div><BoundaryCompareMap original={sourceGeometry} prepared={preparedGeometry} showOriginal={mapMode !== "prepared"} showPrepared={mapMode !== "source"}/><p className="text-xs text-muted-foreground"><span className="text-blue-700">Blue dashed: source</span> · <span className="text-red-700">Red: prepared</span></p></div>
            <div className="grid gap-3 text-sm sm:grid-cols-3"><div className="border-l-2 border-emerald-600 pl-3"><p className="text-muted-foreground">Interior points</p><p className="font-medium">{containment?.interior_points.toLocaleString()} tested · {containment?.interior_differences} differences</p></div><div className="border-l-2 border-amber-500 pl-3"><p className="text-muted-foreground">Exterior points</p><p className="font-medium">{containment?.exterior_points.toLocaleString()} tested · {containment?.exterior_differences} differences</p></div><div className="border-l-2 border-sky-600 pl-3"><p className="text-muted-foreground">Boundary-near probes</p><p className="font-medium">{containment?.boundary_probe_points.toLocaleString()} tested · {containment?.boundary_differences} differences</p></div></div>
            {!metadata.registration_eligible && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">This candidate is still above the existing registration limit. Choose a higher tolerance to produce a registrable boundary.</p>}
            {containment && containment.grid_differences === 0 && containment.boundary_differences === 0
              ? <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"><ShieldCheck className="h-4 w-4"/>Containment comparison passed.</p>
              : <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p>{containment?.grid_differences ? "Interior/exterior containment differs from source; choose a lower tolerance." : `${containment?.boundary_differences} boundary-near test points differ. Review the overlay before approval.`}</p>{containment?.grid_differences === 0 && !!containment?.boundary_differences && <label className="flex items-start gap-2"><input type="checkbox" checked={acknowledgeEdgeChanges} onChange={(event) => setAcknowledgeEdgeChanges(event.target.checked)}/><span>I reviewed the overlay and acknowledge these boundary-near differences for this operational boundary.</span></label>}</div>}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4"><div className="text-sm text-muted-foreground">Status: <span className="font-medium capitalize text-foreground">{registered ? "registered" : selected.status}</span>{selected.rejection_reason && ` · ${selected.rejection_reason}`}</div><div className="flex flex-wrap justify-end gap-2">{["uploaded", "prepared"].includes(selected.status) && <Button variant="outline" disabled={busy} onClick={() => void action("reject")}>Reject</Button>}{selected.status === "prepared" && <Button disabled={!canApprove || busy} onClick={() => void action("approve")}>Approve Prepared Boundary</Button>}{registered && <Button onClick={onClose}>Done</Button>}</div></div>
          </>}
        </section>}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">{stage === "candidate" && selected?.status === "approved" && sourceGeometry && metadata && preparedGeometry && <Button className="h-auto min-h-8 max-w-full whitespace-normal py-1 text-center" disabled={busy} onClick={() => void action("register")}>{busy ? "Registering..." : "Register Prepared Boundary"}</Button>}<Button type="button" variant="outline" className="ml-auto" onClick={onClose}>Close</Button></footer>
    </div>
  </div>;
}
