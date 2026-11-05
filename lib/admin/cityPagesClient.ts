export interface CityPageModule {
  type: string;
  [key: string]: unknown;
}

export interface CityPage {
  slug: string;
  title: string;
  modules: CityPageModule[];
  [key: string]: unknown;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`;
}

export async function fetchCityPages(cityId: string): Promise<CityPage[]> {
  const res = await fetch(
    `/api/admin/settings/city-pages?cityId=${encodeURIComponent(cityId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(await readError(res));
  const body = await res.json();
  return Array.isArray(body?.pages) ? body.pages : [];
}

// Resolves only after the server confirms the pages were persisted.
export async function saveCityPages(
  cityId: string,
  pages: CityPage[]
): Promise<CityPage[]> {
  const res = await fetch("/api/admin/settings/city-pages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cityId, pages }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = await res.json();
  if (body?.success !== true || !Array.isArray(body?.pages)) {
    throw new Error("Pages were not confirmed as saved");
  }
  return body.pages;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
