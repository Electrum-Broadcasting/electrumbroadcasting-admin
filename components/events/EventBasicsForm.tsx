"use client";

type EventBasicsFormProps = {
  name: string;
  setName: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  eventType: string;
  setEventType: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  eventTypeOptions?: string[];
};

export default function EventBasicsForm({
  name,
  setName,
  slug,
  setSlug,
  eventType,
  setEventType,
  description,
  setDescription,
  eventTypeOptions = [],
}: EventBasicsFormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Basics</h2>

      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          className="border p-2 w-full rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Slug</label>
        <input
          className="border p-2 w-full rounded"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Event Type</label>
        <select
          className="border p-2 w-full rounded"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="">Select an event type…</option>
          {eventTypeOptions.map((type: string) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          className="border p-2 w-full rounded"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}
