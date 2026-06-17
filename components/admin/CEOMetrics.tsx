"use client";

import { useEffect, useState } from "react";

export function CEOMetrics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
        const res = await fetch(`${base}/api/admin/platform/metrics`, {
          cache: "no-store",
        });

        if (res.ok) {
          setMetrics(await res.json());
        }
      } catch (err) {
        console.error("Failed to load metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading metrics…</p>;
  }

  if (!metrics) {
    return <p className="text-sm text-red-600">Failed to load metrics.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Cities" value={metrics.total_cities} />
      <MetricCard label="Stories" value={metrics.total_stories} />
      <MetricCard label="Entities" value={metrics.total_entities} />
      <MetricCard label="Places" value={metrics.total_places} />
      <MetricCard label="Moments" value={metrics.total_moments} />
      <MetricCard label="Users" value={metrics.total_users} />
      <MetricCard label="Ads" value={metrics.total_ads} />
      <MetricCard
        label="Gameplay Sessions"
        value={metrics.total_gameplay_sessions}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-4 flex flex-col">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
