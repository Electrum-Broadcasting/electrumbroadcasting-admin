"use client";

import { useRouter } from "next/navigation";
import { useLoadStory } from "@/hooks/useLoadStory";
import { saveStory } from "@/lib/stories/saveStory";

import StoryBasicsForm from "@/components/stories/StoryBasicsForm";
import StoryHeroImageForm from "@/components/stories/StoryHeroImageForm";
import Story360Form from "@/components/stories/Story360Form";
import StoryMetadataForm from "@/components/stories/StoryMetadataForm";
import StorySponsorForm from "@/components/stories/StorySponsorForm";
import StoryPublishForm from "@/components/stories/StoryPublishForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface EditStoryPageProps {
  params: {
    citySlug: string;
    storySlug: string;
  };
}

export default function EditStoryPage({ params }: EditStoryPageProps) {
  const { citySlug, storySlug } = params;
  const router = useRouter();

  const {
    loading,
    story,
    cityId,

    // Basics
    title,
    setTitle,
    slug,
    setSlug,
    summary,
    setSummary,
    body,
    setBody,
    category,
    setCategory,
    tags,
    setTags,

    // Hero
    heroImageUrl,
    setHeroImageUrl,

    // 360°
    hero360Url,
    setHero360Url,
    thumbnail360Url,
    setThumbnail360Url,
    neighborhood360Url,
    setNeighborhood360Url,
    inline360Urls,
    setInline360Urls,

    // Metadata
    year,
    setYear,
    dateRange,
    setDateRange,
    neighborhood,
    setNeighborhood,

    // Sponsor
    sponsor360Url,
    setSponsor360Url,
    sponsorFlatUrl,
    setSponsorFlatUrl,
    sponsorName,
    setSponsorName,
    sponsorLink,
    setSponsorLink,
    sponsorAltText,
    setSponsorAltText,

    // Publish
    isPublished,
    setIsPublished,

    // Relationships
    events,
    existingRelationships,
  } = useLoadStory(citySlug, storySlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!story) return <div className="p-6">Story not found</div>;

  async function handleSave() {
    await saveStory({
      storyId: story.id,
      citySlug,
      router,

      // Basics
      title,
      slug,
      summary,
      body,
      category,
      tags,

      // Hero
      heroImageUrl,

      // 360°
      hero360Url,
      thumbnail360Url,
      neighborhood360Url,
      inline360Urls,

      // Metadata
      year: year ?? 0,
      dateRange,
      neighborhood,

      // Sponsor
      sponsor360Url,
      sponsorFlatUrl,
      sponsorName,
      sponsorLink,
      sponsorAltText,

      // Publish
      isPublished,

      // Relationships
      existingRelationships,
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Story</h1>
      <div className="space-y-6">
        <StoryBasicsForm
          title={title}
          setTitle={setTitle}
          slug={slug}
          setSlug={setSlug}
          summary={summary}
          setSummary={setSummary}
          body={body}
          setBody={setBody}
          category={category}
          setCategory={setCategory}
          tags={tags}
          setTags={setTags}
        />
        <StoryHeroImageForm heroImageUrl={heroImageUrl} setHeroImageUrl={setHeroImageUrl} citySlug={citySlug} slug={slug} />
        <Story360Form
          hero360Url={hero360Url}
          setHero360Url={setHero360Url}
          thumbnail360Url={thumbnail360Url}
          setThumbnail360Url={setThumbnail360Url}
          neighborhood360Url={neighborhood360Url}
          setNeighborhood360Url={setNeighborhood360Url}
          inline360Urls={inline360Urls}
          setInline360Urls={setInline360Urls} citySlug={""} slug={""}        />
        <StoryMetadataForm
          year={year}
          setYear={setYear}
          dateRange={dateRange}
          setDateRange={setDateRange}
          neighborhood={neighborhood}
          setNeighborhood={setNeighborhood}
        />
        <StorySponsorForm
          sponsor360Url={sponsor360Url}
          setSponsor360Url={setSponsor360Url}
          sponsorFlatUrl={sponsorFlatUrl}
          setSponsorFlatUrl={setSponsorFlatUrl}
          sponsorName={sponsorName}
          setSponsorName={setSponsorName}
          sponsorLink={sponsorLink}
          setSponsorLink={setSponsorLink}
          sponsorAltText={sponsorAltText}
          setSponsorAltText={setSponsorAltText}
        />
        <StoryPublishForm isPublished={isPublished} setIsPublished={setIsPublished} />
        <RelationshipSelector
          fromType="story"
          fromId={story.id}
          availableTargets={[
            { type: "event", label: "Events", items: events },
          ]}
          initialRelationships={existingRelationships}
          onChange={() => {}}
        />      
      
      <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Story
        </button>
      </div>
    </div>
  );
}

