"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteCityAction } from "./actions";

export function CityActions({ city }: { city: any }) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Are you sure you want to delete this city?")) return;

    setLoading(true);

    const result = await deleteCityAction(city.id);

    setLoading(false);

    if (result.error) {
      toast.error("Failed to delete city");
      return;
    }

    toast.success("City deleted");
    window.location.reload();
  }

  return (
    <div className="flex gap-2">
      <a
        href={`/admin/CEO/cities/${city.id}`}
        className="text-blue-600 hover:underline text-sm"
      >
        Edit
      </a>

      <button
        onClick={handleRemove}
        disabled={loading}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>
    </div>
  );
}
