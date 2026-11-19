export type MomentEntityLink = { id: string; role: string | null };
export type MomentLink = { id: string };
export type MomentRelationshipSnapshot = {
  entities: MomentEntityLink[];
  eras: MomentLink[];
  places: MomentLink[];
  neighborhoods: MomentLink[];
  stories: MomentLink[];
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRelationshipUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function links(value: unknown): MomentLink[] | null {
  if (!Array.isArray(value)) return null;
  const result: MomentLink[] = [];
  for (const link of value) {
    if (!isRecord(link) || !isRelationshipUuid(link.id)) return null;
    result.push({ id: link.id.toLowerCase() });
  }
  return new Set(result.map((link) => link.id)).size === result.length ? result : null;
}

export function parseMomentSnapshot(value: unknown): MomentRelationshipSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.entities)) return null;
  const entities: MomentEntityLink[] = [];
  for (const entity of value.entities) {
    if (!isRecord(entity) || !isRelationshipUuid(entity.id)
        || (entity.role !== null && typeof entity.role !== "string")) return null;
    entities.push({ id: entity.id.toLowerCase(), role: entity.role });
  }
  if (new Set(entities.map((entity) => entity.id)).size !== entities.length) return null;
  const eras = links(value.eras);
  const places = links(value.places);
  const neighborhoods = links(value.neighborhoods);
  const stories = links(value.stories);
  if (!eras || !places || !neighborhoods || !stories) return null;
  return { entities, eras, places, neighborhoods, stories };
}
