import { useState, useMemo, useCallback } from "react";
import Globe from "react-globe.gl";
import { Globe as GlobeIcon } from "lucide-react";

const CITIES = [
  { lat: 51.5074, lng: -0.1278, name: "London" },
  { lat: 40.7128, lng: -74.006, name: "New York" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
  { lat: 48.8566, lng: 2.3522, name: "Paris" },
  { lat: 34.0522, lng: -118.2437, name: "Los Angeles" },
  { lat: 22.3193, lng: 114.1694, name: "Hong Kong" },
  { lat: 1.3521, lng: 103.8198, name: "Singapore" },
  { lat: 25.2048, lng: 55.2708, name: "Dubai" },
  { lat: 52.52, lng: 13.405, name: "Berlin" },
  { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney" },
  { lat: 41.9028, lng: 12.4964, name: "Rome" },
];

function generateArcs() {
  const arcs: Array<{ startLat: number; startLng: number; endLat: number; endLng: number; color: string }> = [];
  const used = new Set<string>();
  for (let i = 0; i < 14; i++) {
    const a = CITIES[Math.floor(Math.random() * CITIES.length)];
    const b = CITIES[Math.floor(Math.random() * CITIES.length)];
    if (a === b) continue;
    const key = [a.name, b.name].sort().join("-");
    if (used.has(key)) continue;
    used.add(key);
    arcs.push({
      startLat: a.lat, startLng: a.lng,
      endLat: b.lat, endLng: b.lng,
      color: Math.random() > 0.5 ? "rgba(34,211,238,0.6)" : "rgba(168,85,247,0.4)",
    });
  }
  return arcs;
}

const COVERAGE_STATS = [
  { value: "190+", label: "Countries" },
  { value: "700+", label: "Carriers" },
  { value: "24/7", label: "Uptime" },
];

export function LiveGlobeView() {
  const [arcsData] = useState(() => generateArcs());

  const pointsData = useMemo(
    () => CITIES.map((c) => ({ lat: c.lat, lng: c.lng, name: c.name })),
    []
  );

  const arcColor = useCallback((d: { color: string }) => d.color, []);
  const pointLabel = useCallback((d: { name: string }) => d.name, []);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-[#0a0a12]">
      <div className="flex items-center w-full px-5 py-3 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <GlobeIcon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">eSIMLaunch Network</h3>
            <p className="text-[11px] text-muted-foreground">
              Global eSIM coverage — {COVERAGE_STATS.map(s => `${s.value} ${s.label}`).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative h-[260px] w-full">
        <Globe
          width={undefined}
          height={260}
          globeImageUrl="/earth-blue-marble.jpg"
          bumpImageUrl="/earth-topology.png"
          backgroundColor="#0a0a12"
          backgroundImageUrl="/night-sky.png"
          showAtmosphere={true}
          atmosphereColor="#22d3ee"
          atmosphereAltitude={0.2}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointLabel={pointLabel}
          pointColor={() => "#22d3ee"}
          pointAltitude={0.015}
          pointRadius={0.35}
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={arcColor}
          arcStroke={0.2}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
        />
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
        {COVERAGE_STATS.map((s) => (
          <div key={s.label} className="px-4 py-3 text-center">
            <p className="text-lg font-bold gradient-text">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
