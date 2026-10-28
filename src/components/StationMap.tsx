import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Station } from "@/lib/ev-data";

maplibregl.setWorkerUrl(workerUrl);

export interface MapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  setUser: (lng: number, lat: number) => void;
}

const COLORS = { available: "#9be15d", busy: "#f2994a", construction: "#f2c94c", potential: "#56ccf2" };

const StationMap = forwardRef<MapHandle, { stations: Station[]; mode: "2d" | "3d"; onSelect: (s: Station) => void }>(
  function StationMap({ stations, mode, onSelect }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const userMarker = useRef<maplibregl.Marker | null>(null);
    const selectRef = useRef(onSelect);
    selectRef.current = onSelect;

    useImperativeHandle(ref, () => ({
      flyTo: (lng, lat, zoom = 13) => map.current?.flyTo({ center: [lng, lat], zoom, speed: 1.4, curve: 1.4, essential: true }),
      setUser: (lng, lat) => {
        if (!map.current) return;
        userMarker.current?.remove();
        const dot = document.createElement("div");
        dot.style.cssText = "width:18px;height:18px;border-radius:50%;background:#56ccf2;border:3px solid white;box-shadow:0 0 0 8px rgba(86,204,242,.25)";
        userMarker.current = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map.current);
      },
    }));

    useEffect(() => {
      if (!el.current) return;
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
          data: toGeo(stations),
          cluster: true,
          clusterRadius: 45,
          clusterMaxZoom: 9,
        });
        m.addLayer({ id: "clusters", type: "circle", source: "stations", filter: ["has", "point_count"],
          paint: { "circle-color": "#9be15d", "circle-opacity": 0.25, "circle-stroke-color": "#9be15d", "circle-stroke-width": 2,
            "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 30, 30] } });
        m.addLayer({ id: "cluster-count", type: "symbol", source: "stations", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Bold"] },
          paint: { "text-color": "#ffffff" } });
        m.addLayer({ id: "pts", type: "circle", source: "stations", filter: ["!", ["has", "point_count"]],
          paint: { "circle-color": ["match", ["get", "status"], "available", COLORS.available, "busy", COLORS.busy, "construction", COLORS.construction, COLORS.potential],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 14, 10], "circle-stroke-color": "#0b1220", "circle-stroke-width": 2 } });
        m.on("click", "clusters", (e: maplibregl.MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (f) m.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom: m.getZoom() + 2.5, duration: 700 });
        });
        m.on("click", "pts", (e: maplibregl.MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (!f) return;
          const s = stations.find((x) => x.id === f.properties?.id);
          if (!s) return;
          selectRef.current(s);
          new maplibregl.Popup({ offset: 12 }).setLngLat([s.lng, s.lat])
            .setHTML(`<strong>${s.name}</strong><br/><span style="opacity:.7">${s.city}, ${s.state}</span><br/>${s.inUse}/${s.chargers} in use · ${s.powerKw} kW<br/><span style="color:${COLORS[s.status as keyof typeof COLORS]};text-transform:capitalize">${s.status}</span>`)
            .addTo(m);
        });
        for (const l of ["clusters", "pts"]) {
          m.on("mouseenter", l, () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", l, () => (m.getCanvas().style.cursor = ""));
        }
      });
      return () => m.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const m = map.current;
      if (!m) return;
      const apply = () => {
        const src = m.getSource("stations") as maplibregl.GeoJSONSource | undefined;
        src?.setData(toGeo(stations));
      };
      if (m.isStyleLoaded()) apply(); else m.once("load", apply);
    }, [stations]);

    useEffect(() => {
      const m = map.current;
      if (!m) return;
      const apply = () => {
        if (mode === "3d") {
          if (!m.getLayer("3d-buildings") && m.getSource("openmaptiles")) {
            m.addLayer({ id: "3d-buildings", source: "openmaptiles", "source-layer": "building", type: "fill-extrusion", minzoom: 13,
              paint: { "fill-extrusion-color": "#2a3a52", "fill-extrusion-height": ["coalesce", ["get", "render_height"], 10],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.85 } }, "clusters");
          }
          m.easeTo({ pitch: 60, bearing: -20, duration: 1200 });
        } else {
          if (m.getLayer("3d-buildings")) m.removeLayer("3d-buildings");
          m.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
        }
      };
      if (m.isStyleLoaded()) apply(); else m.once("load", apply);
    }, [mode]);

    return <div ref={el} className="h-full w-full" />;
  },
);

function toGeo(stations: Station[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lng, s.lat] }, properties: { id: s.id, status: s.status } })),
  };
}

export default StationMap;
