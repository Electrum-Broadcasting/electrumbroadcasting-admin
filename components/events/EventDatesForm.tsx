"use client";

export default function EventDatesForm({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dates</h2>

      <div>
        <label className="block font-medium mb-1">Start Date</label>
        <input
          type="date"
          className="border p-2 w-full rounded"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">End Date</label>
        <input
          type="date"
          className="border p-2 w-full rounded"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
    </div>
  );
}
