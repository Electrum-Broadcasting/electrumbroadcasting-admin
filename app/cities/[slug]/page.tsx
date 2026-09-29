export default async function CityPage({ params }: { params: { slug: string } }) {
  const res = await fetch(`/api/public/cities/${params.slug}`, {
    cache: "no-store",
  });
  const city = await res.json();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-6">
      <h1 className="text-4xl font-bold">{city.name}, {city.state}</h1>

      <p className="opacity-80">{city.description}</p>

      <div className="space-y-2">
        <a href={`https://electrumatlas.world/cities/${city.slug}`} className="text-blue-500 underline">
          View on Atlas
        </a>

        <a href={`/360/${city.slug}`} className="text-blue-500 underline">
          View 360 Lander
        </a>
      </div>

      <p className="text-sm opacity-60">More features coming soon.</p>
    </div>
  );
}
