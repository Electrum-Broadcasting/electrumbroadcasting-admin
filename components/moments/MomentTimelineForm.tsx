"use client";

function toLocalInputFormat(ts: string | null): string {
  if (!ts) return "";

  // Convert any ISO timestamp into a valid datetime-local string
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function MomentTimelineForm({

  momentTime,
  setMomentTime,
  eras,
  selectedEras,
  setSelectedEras,
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Timeline</h2>
 
      <div>
        <label className="block mb-1">Time</label>
        <input
          type="datetime-local"
          className="border p-2 w-full"
          value={toLocalInputFormat(momentTime)}
          onChange={(e) => setMomentTime(e.target.value)}
        />
      </div>

      <div>
        <h3 className="font-medium mb-2">Eras</h3>
        <div className="space-y-2">
          {(eras ?? []).map((era) => (
            <label key={era.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedEras.includes(era.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedEras([...selectedEras, era.id]);
                  } else {
                    setSelectedEras(
                      selectedEras.filter((id) => id !== era.id)
                    );
                  }
                }}
              />
              {era.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
