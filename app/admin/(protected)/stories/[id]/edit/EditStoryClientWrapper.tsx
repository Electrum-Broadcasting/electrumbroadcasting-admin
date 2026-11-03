"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveStory } from "@/lib/stories/saveStory";

import StoryBasicsForm from "@/components/stories/StoryBasicsForm";
import StoryHeroImageForm from "@/components/stories/StoryHeroImageForm";
import Story360Form from "@/components/stories/Story360Form";
import StoryEventsForm from "@/components/stories/StoryEventsForm";
import StoryMetadataForm from "@/components/stories/StoryMetadataForm";
import StorySponsorForm from "@/components/stories/StorySponsorForm";
import StoryPublishForm from "@/components/stories/StoryPublishForm";

type EditStoryClientWrapperProps = {
  story: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    body: string;
    category: string;
    tags: string[];
    hero_image_url: string;
    hero_360_url: string;
    thumbnail_360_url: string;
    neighborhood_360_url: string;
    inline_360_urls?: string[];
    year: number;
    date_range: string;
    neighborhood: string;
    sponsor_360_url: string;
    sponsor_flat_url: string;
    sponsor_name: string;
    sponsor_link: string;
    sponsor_alt_text: string;
    is_published: boolean;
  };
  citySlug: string;
};

export default function EditStoryClientWrapper({
  story,
  citySlug,
}: EditStoryClientWrapperProps) {
  const router = useRouter();

  // Basics
  const [title, setTitle] = useState(story.title);
  const [slug, setSlug] = useState(story.slug);
  const [summary, setSummary] = useState(story.summary);
  const [body, setBody] = useState(story.body);
  const [category, setCategory] = useState(story.category);
  const [tags, setTags] = useState(story.tags.join(", "));

  // Hero
  const [heroImageUrl, setHeroImageUrl] = useState(story.hero_image_url);

// 360°
const [hero360Url, setHero360Url] = useState(story.hero_360_url);
const [thumbnail360Url, setThumbnail360Url] = useState(story.thumbnail_360_url);
const [neighborhood360Url, setNeighborhood360Url] = useState(story.neighborhood_360_url);

// Keep inline360Urls for saving, but do NOT edit it
const [inline360Urls] = useState(story.inline_360_urls ?? []);

  // Metadata
  const [year, setYear] = useState(story.year);
  const [dateRange, setDateRange] = useState(story.date_range);
  const [neighborhood, setNeighborhood] = useState(story.neighborhood);

  // Sponsor
  const [sponsor360Url, setSponsor360Url] = useState(story.sponsor_360_url);
  const [sponsorFlatUrl, setSponsorFlatUrl] = useState(story.sponsor_flat_url);
  const [sponsorName, setSponsorName] = useState(story.sponsor_name);
  const [sponsorLink, setSponsorLink] = useState(story.sponsor_link);
  const [sponsorAltText, setSponsorAltText] = useState(story.sponsor_alt_text);

  // Publish
  const [isPublished, setIsPublished] = useState(story.is_published);

  async function handleSave() {
    await saveStory({
      storyId: story.id,
      citySlug: citySlug,
      router,

      title,
      slug,
      summary,
      body,
      category,
      tags,

      heroImageUrl,

      hero360Url,
      thumbnail360Url,
      neighborhood360Url,
      inline360Urls,

      year,
      dateRange,
      neighborhood,

      sponsor360Url,
      sponsorFlatUrl,
      sponsorName,
      sponsorLink,
      sponsorAltText,

      isPublished,

      existingRelationships: [],
    });
  }

  return (
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

      <StoryHeroImageForm
        heroImageUrl={heroImageUrl}
        setHeroImageUrl={setHeroImageUrl}
        citySlug={citySlug}
        slug={slug}
      />

      <Story360Form
  hero360Url={hero360Url}
  setHero360Url={setHero360Url}
  thumbnail360Url={thumbnail360Url}
  setThumbnail360Url={setThumbnail360Url}
  neighborhood360Url={neighborhood360Url}
  setNeighborhood360Url={setNeighborhood360Url}
  citySlug={citySlug}
  slug={slug}
/>

      <StoryEventsForm events={[]} />

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

      <StoryPublishForm
  isPublished={isPublished}
  setIsPublished={setIsPublished}
/>

<button
  onClick={handleSave}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  Save Story
</button>

    </div>
  );
}
