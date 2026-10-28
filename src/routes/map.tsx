import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { LocateFixed, Search, Box, Square, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getStations, type Station, type StationStatus } from "@/lib/ev-data";
import type { MapHandle } from "@/components/StationMap";

const StationMap = lazy(() => import("@/components/StationMap"));

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Charging Map — Power Grid" },
      { name: "description", content: "Interactive 2D/3D map of EV charging stations across India with near-me search." },
      { property: "og:title", content: "Live Charging Map — Power Grid" },
      { property: "og:description", content: "Interactive 2D/3D map of EV charging stations across India." },
    ],
  }),
  component: MapPage,
});

const STATUS: { key: StationStatus; label: string; cls: string }[] = [
  { key: "available", label: "Available", cls: "bg-success" },
  { key: "busy", label: "Crowded", cls: "bg-chart-4" },
  { key: "construction", label: "Under construction", cls: "bg-warning" },
  { key: "potential", label: "Potential site", cls: "bg-accent" },
];

function dist(a: number, b: number, c: number, d: number) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function MapPage() {
  const all = useMemo(() => getStations(), []);
  const mapRef = useRef<MapHandle>(null);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [filters, setFilters] = useState<Set<StationStatus>>(new Set(STATUS.map((s) => s.key)));
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Station | null>(null);

  const visible = useMemo(() => all.filter((s) => filters.has(s.status)), [all, filters]);
  const nearby = useMemo(() => {
    if (!origin) return [];
    return visible.map((s) => ({ s, d: dist(origin.lat, origin.lng, s.lat, s.lng) })).sort((a, b) => a.d - b.d).slice(0, 8);
  }, [origin, visible]);

  function goTo(lat: number, lng: number, label: string) {
    setOrigin({ lat, lng, label });
    mapRef.current?.setUser(lng, lat);
    mapRef.current?.flyTo(lng, lat, 11.5);
  }

  function locate() {
    if (!navigator.geolocation) { toast.error("Location isn't supported in this browser."); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); goTo(p.coords.latitude, p.coords.longitude, "Your location"); },
      () => { setBusy(false); toast.error("Location permission denied — search by city instead."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setBusy(true);
    try {
      const q = encodeURIComponent(`${area ? area + ", " : ""}${city}, India`);
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
      const j = (await r.json()) as { lat: string; lon: string; display_name: string }[];
      if (!j[0]) toast.error("Place not found. Try another city or area.");
      else goTo(parseFloat(j[0].lat), parseFloat(j[0].lon), [area, city].filter(Boolean).join(", "));
    } catch {
      toast.error("Search failed. Please try again.");
    } finally { setBusy(false); }
  }

  const toggle = (k: StationStatus) => setFilters((f) => { const n = new Set(f); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <div className="glass rounded-xl p-4">
          <h2 className="font-semibold">Find stations near you</h2>
          <button onClick={locate} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} Use my location
          </button>
          <form onSubmit={search} className="mt-3 space-y-2">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. Pune)" className="w-full rounded-lg border bg-input px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area (optional, e.g. Hinjewadi)" className="w-full rounded-lg border bg-input px-3 py-2 text-sm outline-none focus:border-primary" />
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm hover:bg-secondary"><Search className="h-4 w-4" /> Search</button>
          </form>
        </div>
        <div className="glass rounded-xl p-4">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Show</h3>
          {STATUS.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={filters.has(s.key)} onChange={() => toggle(s.key)} className="accent-primary" />
              <span className={`h-2.5 w-2.5 rounded-full ${s.cls}`} /> {s.label}
              <span className="ml-auto text-xs text-muted-foreground">{all.filter((x) => x.status === s.key).length}</span>
            </label>
          ))}
        </div>
        {origin && (
          <div className="glass max-h-80 overflow-y-auto rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold">Nearest to {origin.label}</h3>
            {nearby.map(({ s, d }) => (
              <button key={s.id} onClick={() => { setSelected(s); mapRef.current?.flyTo(s.lng, s.lat, 15); }} className="flex w-full items-start gap-2 rounded-lg p-2 text-left hover:bg-secondary">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 text-sm"><span className="block font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.city} · {s.inUse}/{s.chargers} in use · {s.status}</span></span>
                <span className="text-xs text-muted-foreground">{d.toFixed(1)} km</span>
              </button>
            ))}
          </div>
        )}
        {selected && !origin && (
          <div className="glass rounded-xl p-4 text-sm">
            <p className="font-semibold">{selected.name}</p>
            <p className="text-muted-foreground">{selected.city}, {selected.state} · {selected.powerKw} kW</p>
          </div>
        )}
      </aside>
      <div className="glass relative h-[78vh] overflow-hidden rounded-xl">
        <ClientOnly fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
          <Suspense fallback={null}>
            <StationMap ref={mapRef} stations={visible} mode={mode} onSelect={setSelected} />
          </Suspense>
        </ClientOnly>
        <div className="glass absolute left-3 top-3 flex rounded-lg p-1">
          {(["2d", "3d"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {m === "2d" ? <Square className="h-3.5 w-3.5" /> : <Box className="h-3.5 w-3.5" />} {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
