"use client";

import dynamic from "next/dynamic";
import type { RunPoint } from "@/lib/types";

// Leaflet touches `window`/`document` at import time, so this can only ever
// render on the client — ssr:false is only legal here because THIS file is
// itself a Client Component (Next disallows it directly from a Server one).
const LeafletMapInner = dynamic(() => import("@/components/leaflet-map-inner"), {
  ssr: false,
  loading: () => <div className="flex size-full items-center justify-center text-sm text-muted-foreground">Chargement de la carte...</div>,
});

export function RunMap({ points, className = "h-64 w-full overflow-hidden rounded-lg" }: { points: RunPoint[]; className?: string }) {
  return (
    <div className={className}>
      <LeafletMapInner points={points} />
    </div>
  );
}
