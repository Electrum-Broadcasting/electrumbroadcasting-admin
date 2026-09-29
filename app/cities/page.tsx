import Link from "next/link";

interface City {
  id: string;
  name: string;
  state: string;
  description: string;
  population: number;
  founded_year: number;
  incorporated_year: number;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  slug: string;
  domain: string;
}

export default async function CitiesIndexPage() {
  // Fetch all cities from the API
  const res = await fetch("/api/public/cities", { cache: "no-store" });

  const cities: City[] = await res.json();

  return (
    <div className="min-h-screen bg-gray-50 p-10 space-y-10">
      <h1 className="text-4xl font-bold text-gray-900">Cities of Electrum</h1>

      <p className="text-gray-700 max-w-2xl">
        Electrum’s civic atlas begins with the cities that anchor its memory
        network. Each city profile includes its legal identity, historical
        origins, and the entities that define its civic storyworld.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cities.map((city) => (
          <Link
            key={city.id}
            href={`/cities/${city.slug}`}
            className="block border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-2xl font-semibold text-gray-900">
              {city.name}, {city.state}
            </h2>

            <p className="text-gray-600 mt-2 line-clamp-3">
              {city.description}
            </p>

            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>
                <span className="font-medium">Incorporated:</span>{" "}
                {city.incorporated_year}
              </p>
              <p>
                <span className="font-medium">Founded:</span>{" "}
                {city.founded_year}
              </p>
              <p>
                <span className="font-medium">Population:</span>{" "}
                {city.population.toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Domain:</span>{" "}
                {city.domain}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
