"use client";

import { useEffect, useState } from "react";

export default function BrandMotionEditor({ cityId }: { cityId: string }) {
  const [motion, setMotion] = useState({
    duration_short: 150,
    duration_medium: 300,
    duration_long: 600,
    easing: "ease-in-out",
  });

  // Load motion settings
  useEffect(() => {
    async function loadMotion() {
      const res = await fetch(
        `/api/admin/settings/brand/motion?cityId=${cityId}`
      );
      const data = await res.json();

      if (data) {
        setMotion({
          duration_short: data.duration_short ?? 150,
          duration_medium: data.duration_medium ?? 300,
          duration_long: data.duration_long ?? 600,
          easing: data.easing ?? "ease-in-out",
        });
      }
    }

    loadMotion();
  }, [cityId]);

  // Save motion settings
  async function handleSave() {
    await fetch("/api/admin/settings/brand/motion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId,
        motion,
      }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Motion Settings</h2>

      <div>
        <label>Short Duration (ms)</label>
        <input
          type="number"
          value={motion.duration_short}
          onChange={(e) =>
            setMotion({ ...motion, duration_short: parseInt(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Medium Duration (ms)</label>
        <input
          type="number"
          value={motion.duration_medium}
          onChange={(e) =>
            setMotion({ ...motion, duration_medium: parseInt(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Long Duration (ms)</label>
        <input
          type="number"
          value={motion.duration_long}
          onChange={(e) =>
            setMotion({ ...motion, duration_long: parseInt(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Easing</label>
        <input
          type="text"
          value={motion.easing}
          onChange={(e) => setMotion({ ...motion, easing: e.target.value })}
        />
      </div>

      <button onClick={handleSave}>Save Motion</button>
    </div>
  );
}