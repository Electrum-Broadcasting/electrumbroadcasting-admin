"use client";

import { useState } from "react";

export function CityForm({ mode, city }: { mode: "create" | "edit"; city?: any }) {
  const [name, setName] = useState(city?.name ?? "");
  const [slug, setSlug] = useState(city?.slug ?? "");
  const [domain, setDomain] = useState(city?.domain ?? "");
  const [status, setStatus] = useState(city?.status ?? "draft");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = { name, slug, domain, status };

    if (mode === "create") {
      await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/admin/cities/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setLoading(false);
    window.location.href = "/admin/CEO/cities";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Slug</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Domain (optional)</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Status</label>
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
      >
        {mode === "create" ? "Create City" : "Save Changes"}
      </button>
    </form>
  );
}
