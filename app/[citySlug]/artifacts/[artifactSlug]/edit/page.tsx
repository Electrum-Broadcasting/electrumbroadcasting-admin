"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useLoadArtifact } from "@/hooks/useLoadArtifact";
import { saveArtifact } from "@/lib/artifacts/saveArtifact";

export default function EditArtifactPage() {
  const params = useParams();
  const citySlug = params.citySlug as string;
  const artifactSlug = params.artifactSlug as string;

  const {
    loading,
    artifact,
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    artifactType,
    setArtifactType,
    year,
    setYear,
    tags,
    setTags,
    heroImageUrl,
    setHeroImageUrl,
    mediaUrls,
    setMediaUrls,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,
  } = useLoadArtifact(citySlug, artifactSlug);

  console.log("citySlug:", citySlug);
console.log("artifactSlug:", artifactSlug);

  const [saving, setSaving] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (!artifact) return <div>Artifact not found.</div>;

  async function handleSave() {
    setSaving(true);
    const { error } = await saveArtifact({
      citySlug,
      artifactSlug: slug || artifactSlug,
      title,
      description,
      artifactType,
      year,
      tags,
      heroImageUrl,
      mediaUrls,
      thumbnailUrl,
      isPublished,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      alert("Error saving artifact");
    } else {
      alert("Artifact saved");
    }
  }

  return (
    <div>
      <h1>Edit Artifact</h1>
      {/* plug in your existing forms here */}
      <button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
