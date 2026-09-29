"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveStory } from "@/lib/stories/saveStory";

import StoryBasicsForm from "@/components/stories/StoryBasicsForm";
import StoryHeroImageForm from "@/components/stories/StoryHeroImageForm";
import Story360Form from "@/components/stories/Story360Form";
import StoryEventsForm from "@/components/stories/StoryEventsForm";
import StoryMetadataForm from "@/components/stories/StoryMetadataForm";
import StorySponsorForm from "@/components/stories/StorySponsorForm";
import StoryPublishForm from "@/components/stories/StoryPublishForm";

export default function NewStoryPage() {
  const router = useRouter();
  const [sponsor360Url, setSponsor360Url] = useState("");
  const [sponsorFlatUrl, setSponsorFlatUrl] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorAltText, setSponsorAltText] = useState("");
  const [year, setYear] = useState(0);
  const [dateRange, setDateRange] = useState("");

  async function handleSave(formData: Parameters<typeof saveStory>[0]) {
    await saveStory({
      ...formData,
      storyId: crypto.randomUUID(),
      citySlug: formData.citySlug,
      router,
    });
  }

  return (
    <AdminShell
      email={null}
      role="CITY_ADMIN"
      title="Create Story"
      cityName=""
    >
      <div className="space-y-6">
        <StoryBasicsForm title={""} setTitle={function (value: string): void {
          throw new Error("Function not implemented.");
        } } slug={""} setSlug={function (value: string): void {
          throw new Error("Function not implemented.");
        } } summary={""} setSummary={function (value: string): void {
          throw new Error("Function not implemented.");
        } } body={""} setBody={function (value: string): void {
          throw new Error("Function not implemented.");
        } } category={""} setCategory={function (value: string): void {
          throw new Error("Function not implemented.");
        } } tags={""} setTags={function (value: string): void {
          throw new Error("Function not implemented.");
        } } />
        <StoryHeroImageForm heroImageUrl={""} setHeroImageUrl={function (url: string): void {
          throw new Error("Function not implemented.");
        } } citySlug={""} slug={""} />
        <Story360Form hero360Url={""} setHero360Url={function (url: string): void {
          throw new Error("Function not implemented.");
        } } thumbnail360Url={""} setThumbnail360Url={function (url: string): void {
          throw new Error("Function not implemented.");
        } } neighborhood360Url={""} setNeighborhood360Url={function (url: string): void {
          throw new Error("Function not implemented.");
        } } citySlug={""} slug={""} />
        <StoryEventsForm onSave={handleSave} />
        <StoryMetadataForm
          year={year}
          setYear={setYear}
          dateRange={dateRange}
          setDateRange={setDateRange} neighborhood={""} setNeighborhood={function (neighborhood: string): void {
            throw new Error("Function not implemented.");
          } }        />
        <StorySponsorForm
          sponsor360Url={sponsor360Url}
          setSponsor360Url={setSponsor360Url}
          sponsorFlatUrl={sponsorFlatUrl}
          setSponsorFlatUrl={setSponsorFlatUrl}
          sponsorName={sponsorName}
          setSponsorName={setSponsorName}
          sponsorAltText={sponsorAltText}
          setSponsorAltText={setSponsorAltText} sponsorLink={""} setSponsorLink={function (value: string): void {
            throw new Error("Function not implemented.");
          } }        />
        <StoryPublishForm isPublished={false} setIsPublished={function (value: boolean): void {
          throw new Error("Function not implemented.");
        } } />
      </div>
    </AdminShell>
  );
}
