"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { RunPoint } from "@/lib/types";

// Leaflet's default marker icon breaks under webpack/Next bundling (the
// image URLs it computes at import time don't resolve) — repoint them at
// the CDN-hosted assets instead of trying to make local bundling work.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitToRoute({ points }: { points: RunPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 16);
      return;
    }
    map.fitBounds(
      points.map((p) => [p.lat, p.lng]),
      { padding: [24, 24] }
    );
  }, [points, map]);
  return null;
}

export default function LeafletMapInner({ points }: { points: RunPoint[] }) {
  const center: [number, number] = points.length
    ? [points[points.length - 1].lat, points[points.length - 1].lng]
    : [48.8566, 2.3522];

  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom={false} className="size-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.length > 1 && (
        <Polyline positions={points.map((p) => [p.lat, p.lng])} color="#8b5cf6" weight={4} />
      )}
      {points.length > 0 && (
        <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]} />
      )}
      <FitToRoute points={points} />
    </MapContainer>
  );
}
