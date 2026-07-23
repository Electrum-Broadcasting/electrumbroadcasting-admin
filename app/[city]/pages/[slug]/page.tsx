import { createClient } from "@supabase/supabase-js";

type ModuleConfig = { type: string; limit?: number };
type PageConfig = {
  slug: string;
  title: string;
  subtitle?: string;
  modules: ModuleConfig[];
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getCityBrandSettings(citySlug: string) {
  const { data, error } = await supabase
    .from("city_brand_settings")
    .select("pages, city_id")
    .eq("city_slug", citySlug)
    .single();

  if (error || !data) return null;
  return data as { pages: PageConfig[]; city_id: string };
}

async function getModuleData(
  cityId: string,
  module: ModuleConfig
): Promise<any[]> {
  const limit = module.limit ?? 10;

  switch (module.type) {
    case "stories": {
      const { data } = await supabase
        .from("civic_stories")
        .select("*")
        .eq("primary_city_id", cityId)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      return data || [];
    }
    case "places": {
      const { data } = await supabase
        .from("civic_places")
        .select("*")
        .eq("primary_city_id", cityId)
        .limit(limit);
      return data || [];
    }
    case "neighborhoods": {
      const { data } = await supabase
        .from("civic_neighborhoods")
        .select("*")
        .eq("primary_city_id", cityId)
        .limit(limit);
      return data || [];
    }
    case "moments": {
      const { data } = await supabase
        .from("civic_moments")
        .select("*")
        .eq("primary_city_id", cityId)
        .limit(limit);
      return data || [];
    }
    case "eras": {
      const { data } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("primary_city_id", cityId)
        .limit(limit);
      return data || [];
    }
    default:
      return [];
  }
}

export default async function CityPage({
  params,
}: {
  params: { city: string; slug: string };
}) {
  const { city, slug } = params;

  const brand = await getCityBrandSettings(city);
  if (!brand) return <div>City not found.</div>;

  const page = brand.pages.find((p) => p.slug === slug);
  if (!page) return <div>Page not found.</div>;

  const modulesWithData = await Promise.all(
    page.modules.map(async (m) => ({
      config: m,
      data: await getModuleData(brand.city_id, m),
    }))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{page.title}</h1>
        {page.subtitle && (
          <p className="text-gray-600">{page.subtitle}</p>
        )}
      </header>

      <main className="space-y-10">
        {modulesWithData.map((module, index) => (
          <section key={index} className="space-y-4">
            {module.config.type === "stories" && (
              <>
                <h2 className="text-xl font-semibold">Stories</h2>
                <div className="space-y-3">
                  {module.data.map((story: any) => (
                    <article key={story.id} className="border p-4 rounded">
                      <h3 className="font-semibold">{story.title}</h3>
                      {story.summary && (
                        <p className="text-sm text-gray-700">
                          {story.summary}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}

            {module.config.type === "places" && (
              <>
                <h2 className="text-xl font-semibold">Places</h2>
                <ul className="space-y-2">
                  {module.data.map((place: any) => (
                    <li key={place.id} className="border p-3 rounded">
                      <div className="font-semibold">{place.name}</div>
                      {place.description && (
                        <div className="text-sm text-gray-700">
                          {place.description}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {module.config.type === "neighborhoods" && (
              <>
                <h2 className="text-xl font-semibold">Neighborhoods</h2>
                <ul className="space-y-2">
                  {module.data.map((n: any) => (
                    <li key={n.id} className="border p-3 rounded">
                      <div className="font-semibold">{n.name}</div>
                      {n.summary && (
                        <div className="text-sm text-gray-700">
                          {n.summary}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {module.config.type === "moments" && (
              <>
                <h2 className="text-xl font-semibold">Moments</h2>
                <ul className="space-y-2">
                  {module.data.map((m: any) => (
                    <li key={m.id} className="border p-3 rounded">
                      <div className="font-semibold">{m.title}</div>
                      {m.date_range && (
                        <div className="text-xs text-gray-500">
                          {m.date_range}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {module.config.type === "eras" && (
              <>
                <h2 className="text-xl font-semibold">Eras</h2>
                <ul className="space-y-2">
                  {module.data.map((e: any) => (
                    <li key={e.id} className="border p-3 rounded">
                      <div className="font-semibold">{e.name}</div>
                      {e.summary && (
                        <div className="text-sm text-gray-700">
                          {e.summary}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
