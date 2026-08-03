"use client";

export default function ArtifactEventsForm({
  events,
  selectedEventIds,
  setSelectedEventIds,
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Related Events</h2>

      {events.length === 0 && (
        <p className="text-sm text-gray-500">No events available.</p>
      )}

      <div className="space-y-2">
        {events.map((event: any) => (
          <label key={event.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedEventIds.includes(event.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedEventIds([...selectedEventIds, event.id]);
                } else {
                  setSelectedEventIds(
                    selectedEventIds.filter((id: string) => id !== event.id)
                  );
                }
              }}
            />
            {event.name || event.title}
          </label>
        ))}
      </div>
    </div>
  );
}
