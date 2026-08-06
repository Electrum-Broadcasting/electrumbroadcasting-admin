"use client";

console.log("Rendering EntityBasicsForm");

import React from "react";
import EntityRichTextEditor from "./EntityRichTextEditor";

interface EntityBasicsFormProps {
  citySlug: string;
  name: string;
  setName: (v: string) => void;

  slug: string;
  setSlug: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  summary: string;
  setSummary: (v: string) => void;

  entityType: string;
  setEntityType: (v: string) => void;

  roles: string;
  setRoles: (v: string) => void;
}

export default function EntityBasicsForm({
  citySlug,
  name,
  setName,
  slug,
  setSlug,
  description,
  setDescription,
  summary,
  setSummary,
  entityType,
  setEntityType,
  roles,
  setRoles,
}: EntityBasicsFormProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Entity Basics</h2>

      {/* Name */}
      <input
        type="text"
        placeholder="Name"
        className="w-full border p-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Slug */}
      <input
        type="text"
        placeholder="Slug"
        className="w-full border p-2 rounded"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      {/* Description */}
<EntityRichTextEditor
  label="Description"
  value={description}
  onChange={setDescription}
  citySlug={citySlug}
  slug={slug}
/>

      {/* Summary */}
      <textarea
        placeholder="Summary"
        className="w-full border p-2 rounded h-24"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />

      {/* Entity Type */}
      <select
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">Select entity type</option>
        <option value="person">Person</option>
        <option value="organization">Organization</option>
        <option value="musician">Musician</option>
        <option value="nonprofit">Nonprofit</option>
        <option value="business">Business</option>
        <option value="collective">Collective</option>
        <option value="transit agency">Transit Agency</option>
        <option value="filmmaker">Filmmaker</option>
        <option value="writer">Writer</option>
        <option value="photographer">Photographer</option>
        <option value="artist">Artist</option>
        <option value="activist">Activist</option>
        
      </select>

      {/* Roles */}
      <input
        type="text"
        placeholder="Roles (comma-separated)"
        className="w-full border p-2 rounded"
        value={roles}
        onChange={(e) => setRoles(e.target.value)}
      />
    </section>
  );
}
