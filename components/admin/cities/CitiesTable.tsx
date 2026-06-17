"use client";

import { useEffect, useState } from "react";
import { CityActions } from "@/components/admin/cities/CityActions";

export function CitiesTable() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCities() {
      const res = await fetch("/api/admin/cities");
      const data = await res.json();
      setCities(data.cities);
      setLoading(false);
    }
    loadCities();
  }, []);

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading cities…</p>;
  }

  if (cities.length === 0) {
    return <p className="text-slate-500 text-sm">No cities found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Slug</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Domain</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Created</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {cities.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-2 text-sm text-ink">{c.name}</td>
              <td className="px-4 py-2 text-sm text-slate-700">{c.slug}</td>
              <td className="px-4 py-2 text-sm text-slate-700">{c.domain ?? "—"}</td>
              <td className="px-4 py-2 text-sm text-slate-700">{c.status}</td>
              <td className="px-4 py-2 text-sm text-slate-700">
                {new Date(c.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-2 text-sm text-slate-700">
                <CityActions city={c} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
