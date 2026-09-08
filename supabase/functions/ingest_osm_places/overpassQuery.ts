export type BoundingBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

function escapeRegexValues(values: string[]): string {
  return values.map((value) => value.replace(/[|\\]/g, "\\$&")).join("|");
}

export function buildRefinedOverpassQuery(
  boundingBox: BoundingBox,
  batchSize: number,
): string {
  const box = [
    boundingBox.south,
    boundingBox.west,
    boundingBox.north,
    boundingBox.east,
  ].join(",");
  const safeBatchSize = Math.max(1, Math.floor(batchSize));

  const amenityValues = escapeRegexValues([
    "arts_centre",
    "library",
    "marketplace",
    "place_of_worship",
    "school",
    "theatre",
  ]);
  const historicValues = escapeRegexValues([
    "archaeological_site",
    "building",
    "castle",
    "memorial",
    "monument",
    "ruins",
  ]);
  const leisureValues = escapeRegexValues(["garden", "park", "sports_centre"]);
  const publicTransportValues = escapeRegexValues([
    "station",
    "stop_position",
    "platform",
  ]);
  const tourismValues = escapeRegexValues([
    "attraction",
    "gallery",
    "museum",
    "viewpoint",
  ]);

  return `[out:json][timeout:60];
(
  nwr["amenity"~"^(${amenityValues})$"](${box});
  nwr["historic"~"^(${historicValues})$"](${box});
  nwr["leisure"~"^(${leisureValues})$"](${box});
  nwr["public_transport"~"^(${publicTransportValues})$"](${box});
  nwr["tourism"~"^(${tourismValues})$"](${box});
);
out center tags ${safeBatchSize} qt;`;
}