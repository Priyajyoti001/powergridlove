import { describe, expect, it } from "vitest";
import { getStations } from "./ev-data";
import { stationFeatures } from "./station-features";

describe("potential site map data", () => {
  it("keeps only potential sites when the other statuses are excluded", () => {
    const all = getStations();
    const features = stationFeatures(all.filter((s) => s.status === "potential"));
    expect(features.features.length).toBe(22);
    expect(features.features.every((f) => f.properties?.['status'] === "potential")).toBe(true);
  });
  it("marks potential sites for cluster totals without marking operational stations", () => {
    const features = stationFeatures(getStations());
    expect(features.features.filter((f) => f.properties?.['potential'] === 1)).toHaveLength(22);
    expect(features.features.find((f) => f.properties?.['status'] === "available")?.properties?.['potential']).toBe(0);
  });
  it("returns no map points when no statuses are selected", () => {
    expect(stationFeatures([]).features).toHaveLength(0);
  });
});