"use client";

import { useEffect, useRef } from "react";
import type { Polygon, MultiPolygon } from "geojson";
import { cityBoundaryExtent } from "@/lib/ingestion/cityBoundary";

export type QueryBox = { south: number; west: number; north: number; east: number };

export function QueryMap({ geometry, drawing, onChange }: { geometry: Polygon | MultiPolygon; drawing: boolean; onChange: (box: QueryBox | null) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const drawingRef = useRef(drawing);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  onChangeRef.current = onChange;
  drawingRef.current = drawing;

  useEffect(() => {
    if (drawing) mapRef.current?.dragging.disable();
    else mapRef.current?.dragging.enable();
  }, [drawing]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("leaflet").then((leaflet) => {
      if (disposed || !container.current) return;
      const element = container.current;
      const extent = cityBoundaryExtent(geometry);
      const map = leaflet.map(element, { dragging: false, touchZoom: true, scrollWheelZoom: true });
      mapRef.current = map;
      if (!drawingRef.current) map.dragging.enable();
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      leaflet.geoJSON(geometry, { style: { color: "#257466", weight: 2, fillOpacity: 0.05 } }).addTo(map);
      map.fitBounds([[extent.south, extent.west], [extent.north, extent.east]], { padding: [15, 15] });
      let start: import("leaflet").LatLng | null = null;
      let rectangle: import("leaflet").Rectangle | null = null;
      const point = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        return map.containerPointToLatLng([event.clientX - bounds.left, event.clientY - bounds.top]);
      };
      const down = (event: PointerEvent) => {
        if (!drawingRef.current || (event.target as HTMLElement).closest(".leaflet-control")) return;
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        start = point(event);
        if (rectangle) rectangle.remove();
        onChangeRef.current(null);
      };
      const move = (event: PointerEvent) => {
        if (!start) return;
        const bounds = leaflet.latLngBounds(start, point(event));
        if (rectangle) rectangle.setBounds(bounds);
        else rectangle = leaflet.rectangle(bounds, { color: "#b44e2e", weight: 2, fillOpacity: 0.12 }).addTo(map);
      };
      const up = (event: PointerEvent) => {
        if (!start) return;
        const bounds = leaflet.latLngBounds(start, point(event));
        start = null;
        const box = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() };
        if (box.south >= box.north || box.west >= box.east || box.south < extent.south || box.north > extent.north || box.west < extent.west || box.east > extent.east) {
          rectangle?.remove(); rectangle = null; onChangeRef.current(null);
        } else onChangeRef.current(box);
      };
      element.addEventListener("pointerdown", down);
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", up);
      element.addEventListener("pointercancel", up);
      cleanup = () => {
        element.removeEventListener("pointerdown", down); element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", up); element.removeEventListener("pointercancel", up); map.remove(); mapRef.current = null;
      };
    });
    return () => { disposed = true; cleanup(); };
  }, [geometry]);
  return <div ref={container} className="h-[420px] w-full rounded-md border border-border" style={{ touchAction: "none" }} aria-label="Map for drawing an import area" />;
}