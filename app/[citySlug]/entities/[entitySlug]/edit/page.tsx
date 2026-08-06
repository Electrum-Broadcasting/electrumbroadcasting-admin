"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLoadEntity } from "@/hooks/useLoadEntity";
import { saveEntity } from "@/lib/entities/saveEntity";
import { createBrowserClient } from "@/lib/supabase/client";

import EntityBasicsForm from "@/components/entities/EntityBasicsForm";
import EntityLifeForm from "@/components/entities/EntityLifeForm";
import EntityThumbnailForm from "@/components/entities/EntityThumbnailForm";
import EntityMediaForm from "@/components/entities/EntityMediaForm";
import EntityRelationships from "@/components/entities/EntityRelationships";
import EntitySaveActions from "@/components/entities/EntitySaveActions";

export default function EditEntityPage({ params }: { params: { citySlug: string; entitySlug: string } }) {
  const { citySlug, entitySlug } = params;
  const router = useRouter();

  const {
    loading,
    entity,

    // Basics
    name, setName,
    slug, setSlug,
    entityType, setEntityType,
    summary, setSummary,
    description, setDescription,
    roles, setRoles,

    // Media
    heroImageUrl, setHeroImageUrl,
    hero360Url, setHero360Url,
    thumbnailUrl, setThumbnailUrl,
    mediaUrls, setMediaUrls,

    // Publish
    isPublished, setIsPublished,

    // Relationships
    events,
    artifacts,
    stories,
    existingRelationships,
    setExistingRelationships,
  } = useLoadEntity(citySlug, entitySlug);

  // Life fields
  const [birthYear, setBirthYear] = React.useState(entity?.birth_year ?? null);
  const [deathYear, setDeathYear] = React.useState(entity?.death_year ?? null);

  // Override thumbnail state to allow null
  const [thumbnail, setThumbnail] = React.useState<string | null>(thumbnailUrl ?? null);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!entity) return <div className="p-6">Entity not found</div>;

  async function handleSave() {
    await saveEntity({
      entityId: entity.id,
      citySlug,
      router,

      // Basics
      name,
      slug,
      entityType,
      summary,
      description,

      // Life
      birthYear,
      deathYear,

      // Media
      heroImageUrl,
      hero360Url,
      thumbnailUrl: thumbnail ?? "",
      mediaUrls,

      // Publish
      isPublished,

      // Relationships
      existingRelationships,
    });
  }

  async function handleDelete() {
    const confirmed = confirm("Delete this entity? This cannot be undone.");
    if (!confirmed) return;

    const supabase = createBrowserClient();

    await supabase
      .from("civic_relationships")
      .delete()
      .eq("from_type", "entity")
      .eq("from_id", entity.id);

    await supabase.from("civic_entities").delete().eq("id", entity.id);

    router.push(`/${citySlug}/entities`);
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Entity</h1>

      <EntityBasicsForm
        name={name}
        setName={setName}
        slug={slug}
        setSlug={setSlug}
        description={description}
        setDescription={setDescription}
        summary={summary}
        setSummary={setSummary}
        entityType={entityType}
        setEntityType={setEntityType}
        roles={roles}
        setRoles={setRoles}
        citySlug={citySlug}
      />

<EntityLifeForm
  birthYear={birthYear}
  setBirthYear={setBirthYear}
  deathYear={deathYear}
  setDeathYear={setDeathYear}
/>

<EntityThumbnailForm
  thumbnailUrl={thumbnail}
  setThumbnailUrl={setThumbnail}
  citySlug={citySlug}
  slug={slug}
/>

      <EntityMediaForm
        heroImageUrl={heroImageUrl}
        setHeroImageUrl={setHeroImageUrl}
        hero360Url={hero360Url}
        setHero360Url={setHero360Url}
        mediaUrls={mediaUrls}
        setMediaUrls={setMediaUrls}
        citySlug={citySlug}
        slug={slug}
      />

      <EntityRelationships
        entityId={entity.id}
        events={events}
        artifacts={artifacts}
        stories={stories}
        existingRelationships={existingRelationships}
        setExistingRelationships={setExistingRelationships}
      />

<EntitySaveActions
  mode="edit"
  onSave={handleSave}
  onDelete={handleDelete}
/>
    </div>
  );
}
