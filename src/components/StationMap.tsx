import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Point } from "geojson";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Station } from "@/lib/ev-data";
import { stationFeatures } from "@/lib/station-features";

maplibregl.setWorkerUrl(workerUrl);

export interface MapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  setUser: (lng: number, lat: number) => void;
}

function mapColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (token: string) => {
    const value = style.getPropertyValue(token).trim();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return value;
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    return `#${Array.from(pixel.slice(0, 3)).map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  };
  return { available: read("--success"), busy: read("--chart-4"), construction: read("--warning"), potential: read("--accent"), foreground: read("--foreground"), background: read("--background"), building: read("--secondary") };
}

const StationMap = forwardRef<MapHandle, { stations: Station[]; mode: "2d" | "3d"; onSelect: (s: Station) => void }>(
  function StationMap({ stations, mode, onSelect }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const userMarker = useRef<maplibregl.Marker | null>(null);
    const selectRef = useRef(onSelect);
    selectRef.current = onSelect;
    const stationsRef = useRef(stations);
    stationsRef.current = stations;
    const popup = useRef<maplibregl.Popup | null>(null);

    useImperativeHandle(ref, () => ({
      flyTo: (lng, lat, zoom = 13) => map.current?.flyTo({ center: [lng, lat], zoom, speed: 1.4, curve: 1.4, essential: true }),
      setUser: (lng, lat) => {
        if (!map.current) return;
        userMarker.current?.remove();
        const dot = document.createElement("div");
        dot.className = "map-user-marker";
        userMarker.current = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map.current);
      },
    }));

    useEffect(() => {
      if (!el.current) return;
      const colors = mapColors();
      const m = new maplibregl.Map({
        container: el.current,
        style: "https://tiles.openfreemap.org/styles/dark",
        center: [79.5, 22.5],
        zoom: 4.2,
        maxPitch: 75,
        attributionControl: { compact: true },
      });
      map.current = m;
      m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
      m.on("load", () => {
        m.addSource("stations", {
          type: "geojson",
          data: stationFeatures(stationsRef.current),
          cluster: true,
          clusterRadius: 45,
          clusterMaxZoom: 9,
          clusterProperties: { potential_count: ["+", ["get", "potential"]] },
        });
        m.addLayer({ id: "clusters", type: "circle", source: "stations", filter: ["has", "point_count"],
          paint: { "circle-color": ["case", ["==", ["get", "potential_count"], ["get", "point_count"]], colors.potential, colors.available], "circle-opacity": 0.25, "circle-stroke-color": ["case", ["==", ["get", "potential_count"], ["get", "point_count"]], colors.potential, colors.available], "circle-stroke-width": 2,
            "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 30, 30] } });
        m.addLayer({ id: "cluster-count", type: "symbol", source: "stations", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Bold"] },
          paint: { "text-color": colors.foreground } });
        m.addLayer({ id: "pts", type: "circle", source: "stations", filter: ["!", ["has", "point_count"]],
          paint: { "circle-color": ["match", ["get", "status"], "available", colors.available, "busy", colors.busy, "construction", colors.construction, colors.potential],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 14, 10], "circle-stroke-color": colors.background, "circle-stroke-width": 2 } });
        m.on("click", "clusters", (e: maplibregl.MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (f) m.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom: m.getZoom() + 2.5, duration: 700 });
        });
        m.on("click", "pts", (e: maplibregl.MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (!f) return;
          const s = stationsRef.current.find((x) => x.id === f.properties?.['id']);
          if (!s) return;
          selectRef.current(s);
          popup.current?.remove();
          const content = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = s.status === "potential" ? `Potential site · ${s.city}` : s.name;
          const details = document.createElement("p");
          details.textContent = `${s.city}, ${s.state}`;
          const status = document.createElement("p");
          status.textContent = s.status === "potential" ? "Illustrative proposed site · Not operational" : s.status === "construction" ? "Under construction · Not operational" : `${s.inUse}/${s.chargers} in use · ${s.powerKw} kW · ${s.status}`;
          content.append(title, details, status);
          popup.current = new maplibregl.Popup({ offset: 12 }).setLngLat([s.lng, s.lat]).setDOMContent(content).addTo(m);
        });
        for (const l of ["clusters", "pts"]) {
          m.on("mouseenter", l, () => { m.getCanvas().style.cursor = "pointer"; });
          m.on("mouseleave", l, () => { m.getCanvas().style.cursor = ""; });
        }
      });
      return () => { popup.current?.remove(); userMarker.current?.remove(); m.remove(); map.current = null; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const m = map.current;
      if (!m) return;
      const apply = () => {
        const src = m.getSource("stations") as maplibregl.GeoJSONSource | undefined;
        popup.current?.remove();
        src?.setData(stationFeatures(stations));
      };
      if (m.isStyleLoaded()) apply(); else m.once("load", apply);
      return () => { m.off("load", apply); };
    }, [stations]);

    useEffect(() => {
      const m = map.current;
      if (!m) return;
      const apply = () => {
        if (mode === "3d") {
          if (!m.getLayer("3d-buildings") && m.getSource("openmaptiles")) {
            m.addLayer({ id: "3d-buildings", source: "openmaptiles", "source-layer": "building", type: "fill-extrusion", minzoom: 13,
              paint: { "fill-extrusion-color": mapColors().building, "fill-extrusion-height": ["coalesce", ["get", "render_height"], 10],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.85 } }, "clusters");
          }
          m.easeTo({ pitch: 60, bearing: -20, duration: 1200 });
        } else {
          if (m.getLayer("3d-buildings")) m.removeLayer("3d-buildings");
          m.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
        }
      };
      if (m.isStyleLoaded()) apply(); else m.once("load", apply);
      return () => { m.off("load", apply); };
    }, [mode]);

    return <div ref={el} className="h-full w-full" />;
  },
);

export default StationMap;
