"use client";

export default function EventErasForm({
  eras,
  selectedEraIds,
  setSelectedEraIds,
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Eras</h2>

      <div className="space-y-2">
        {eras.map((era: any) => (
          <label key={era.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedEraIds.includes(era.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedEraIds([...selectedEraIds, era.id]);
                } else {
                  setSelectedEraIds(
                    selectedEraIds.filter((id: string) => id !== era.id)
                  );
                }
              }}
            />
            {era.name} ({era.start_year}–{era.end_year || "Present"})
          </label>
        ))}
      </div>
    </div>
  );
}
