import type { FeatureCollection, Point } from "geojson";
import type { Station } from "@/lib/ev-data";

export function stationFeatures(stations: Station[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: { id: s.id, status: s.status, potential: s.status === "potential" ? 1 : 0 },
    })),
  };
}