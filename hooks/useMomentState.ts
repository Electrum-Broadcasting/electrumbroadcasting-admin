"use client";

import { useState } from "react";

export function useMomentState(initialData: any) {
  const moment = initialData?.moment ?? {
    title: "",
    slug: "",
    body: "",
    moment_time: "",
    thumbnail_360_url: "",
    inline_360_urls: [],
    is_published: false,
  };

  // Basics
  const [title, setTitle] = useState(moment.title);
  const [slug, setSlug] = useState(moment.slug);
  const [body, setBody] = useState(moment.body || "");

  // Timeline
  const [momentTime, setMomentTime] = useState(moment.moment_time || "");

  // Spatial
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>(
    initialData?.momentPlaces?.map((r: any) => r.place_id) || []
  );

  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(
    initialData?.momentNeighborhoods?.map((r: any) => r.neighborhood_id) || []
  );

  // Eras
  const [selectedEras, setSelectedEras] = useState<string[]>(
    initialData?.momentEras?.map((r: any) => r.era_id) || []
  );

  // Media
  const [thumbnail360Url, setThumbnail360Url] = useState(
    moment.thumbnail_360_url || ""
  );
  const [inline360Urls, setInline360Urls] = useState<string[]>(
    moment.inline_360_urls || []
  );

  // Publish
  const [isPublished, setIsPublished] = useState(!!moment.is_published);

  // Relationships
  const [selectedRelationships, setSelectedRelationships] = useState<any[]>(
    initialData?.relationships || []
  );

  return {
    // Basics
    title,
    setTitle,
    slug,
    setSlug,
    body,
    setBody,

    // Timeline
    momentTime,
    setMomentTime,

    // Spatial
    selectedPlaces,
    setSelectedPlaces,
    selectedNeighborhoods,
    setSelectedNeighborhoods,

    // Eras
    selectedEras,
    setSelectedEras,

    // Media
    thumbnail360Url,
    setThumbnail360Url,
    inline360Urls,
    setInline360Urls,

    // Publish
    isPublished,
    setIsPublished,

    // Relationships
    selectedRelationships,
    setSelectedRelationships,
  };
}
