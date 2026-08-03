"use client";

interface StoryMetadataFormProps {
  year: number | null;
  setYear: (year: number) => void;
  dateRange: string;
  setDateRange: (dateRange: string) => void;
  neighborhood: string;
  setNeighborhood: (neighborhood: string) => void;
}

export default function StoryMetadataForm({
  year,
  setYear,
  dateRange,
  setDateRange,
  neighborhood,
  setNeighborhood,
}: StoryMetadataFormProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Civic Metadata</h2>

      <input
        type="number"
        placeholder="Year"
        className="w-full border p-2 rounded"
        value={year || ""}
        onChange={(e) => setYear(Number(e.target.value))}
      />

      <input
        type="text"
        placeholder="Date Range"
        className="w-full border p-2 rounded"
        value={dateRange}
        onChange={(e) => setDateRange(e.target.value)}
      />

      <input
        type="text"
        placeholder="Neighborhood"
        className="w-full border p-2 rounded"
        value={neighborhood}
        onChange={(e) => setNeighborhood(e.target.value)}
      />
    </section>
  );
}
