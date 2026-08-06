"use client";

import React from "react";
import EntityRichTextEditor from "@/components/entities/EntityRichTextEditor";

interface ArtifactBasicsFormProps {
  title: string;
  setTitle: (v: string) => void;

  slug: string;
  setSlug: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  artifactType: string;
  setArtifactType: (v: string) => void;

  citySlug: string;
  artifactSlug: string;
}

export default function ArtifactBasicsForm({
  title,
  setTitle,
  slug,
  setSlug,
  description,
  setDescription,
  artifactType,
  setArtifactType,
  citySlug,
  artifactSlug,
}: ArtifactBasicsFormProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Artifact Basics</h2>

      <input
        type="text"
        placeholder="Title"
        className="w-full border p-2 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="text"
        placeholder="Slug"
        className="w-full border p-2 rounded"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <EntityRichTextEditor
        label="Description"
        value={description}
        onChange={setDescription}
        citySlug={citySlug}
        slug={artifactSlug}
      />

      <input
        type="text"
        placeholder="Artifact Type"
        className="w-full border p-2 rounded"
        value={artifactType}
        onChange={(e) => setArtifactType(e.target.value)}
      />
    </section>
  );
}
