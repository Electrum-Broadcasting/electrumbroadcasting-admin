"use client";

import { useEffect, useRef } from "react";
import type { Polygon, MultiPolygon } from "geojson";

export function BoundaryCompareMap({
  original,
  prepared,
  showOriginal,
  showPrepared,
}: {
  original: Polygon | MultiPolygon;
  prepared: Polygon | MultiPolygon | null;
  showOriginal: boolean;
  showPrepared: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("leaflet").then((leaflet) => {
      if (disposed || !container.current) return;
      const map = leaflet.map(container.current, { scrollWheelZoom: true });
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      const sourceLayer = leaflet.geoJSON(original, {
        style: { color: "#2864a5", weight: 2, fillOpacity: 0.06, dashArray: "6 4" },
      });
      const preparedLayer = prepared ? leaflet.geoJSON(prepared, {
        style: { color: "#bd4a2d", weight: 2, fillOpacity: 0.1 },
      }) : null;
      if (showOriginal) sourceLayer.addTo(map);
      if (preparedLayer && showPrepared) preparedLayer.addTo(map);
      map.fitBounds(sourceLayer.getBounds(), { padding: [12, 12] });
      cleanup = () => map.remove();
    });
    return () => { disposed = true; cleanup(); };
  }, [original, prepared, showOriginal, showPrepared]);

  return <div ref={container} className="h-[320px] w-full rounded-md border border-border" aria-label="Source and prepared boundary map" />;
}