import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Globe from "react-globe.gl";
import { Play, Pause, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock city coordinates for eSIM order flow visualization
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

// Generate mock arcs between cities for "eSIM activations"
function generateArcs() {
  const arcs: Array<{ startLat: number; startLng: number; endLat: number; endLng: number; color: string }> = [];
  const used = new Set<string>();
  for (let i = 0; i < 18; i++) {
    const a = CITIES[Math.floor(Math.random() * CITIES.length)];
    const b = CITIES[Math.floor(Math.random() * CITIES.length)];
    if (a === b) continue;
    const key = [a.name, b.name].sort().join("-");
    if (used.has(key)) continue;
    used.add(key);
    arcs.push({
      startLat: a.lat,
      startLng: a.lng,
      endLat: b.lat,
      endLng: b.lng,
      color: Math.random() > 0.5 ? "#22d3ee" : "#a855f7",
    });
  }
  return arcs;
}

// Mock region trends (eSIM categories)
const MOCK_TRENDS = [
  { name: "Europe", change: 12.8, up: true },
  { name: "Asia Pacific", change: 17.4, up: true },
  { name: "Americas", change: 10.2, up: true },
  { name: "Middle East", change: 8.1, up: true },
  { name: "Global plans", change: 7.7, up: false },
  { name: "Data-only", change: 5.6, up: true },
  { name: "Regional packs", change: 5.6, up: false },
  { name: "Travel bundles", change: 4.2, up: true },
];

// Mock KPIs
const MOCK_KPIS = {
  activeEsims: 84762,
  salesPerMin: 2847,
  ordersPerMin: 312,
  dataConsumed: 1247,
};

export function LiveGlobeView() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [arcsData] = useState(() => generateArcs());

  const pointsData = useMemo(
    () =>
      CITIES.map((c) => ({
        lat: c.lat,
        lng: c.lng,
        name: c.name,
      })),
    []
  );

  const arcColor = useCallback((d: { color: string }) => d.color, []);
  const pointLabel = useCallback((d: { name: string }) => d.name, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border overflow-hidden bg-[#0a0a12]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Live Global Activity</h3>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString()} · eSIM activations in real time
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </motion.button>
      </div>

      {/* Globe container */}
      <div className="relative h-[380px] w-full">
        <Globe
          width={undefined}
          height={380}
          globeImageUrl="/earth-blue-marble.jpg"
          bumpImageUrl="/earth-topology.png"
          backgroundColor="#0a0a12"
          backgroundImageUrl="/night-sky.png"
          showAtmosphere={true}
          atmosphereColor="#22d3ee"
          atmosphereAltitude={0.25}
          // Points (cities)
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointLabel={pointLabel}
          pointColor={() => "#22d3ee"}
          pointAltitude={0.02}
          pointRadius={0.4}
          // Arcs
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={arcColor}
          arcStroke={0.25}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={isPlaying ? 2000 : 0}
        />
        {/* Legend overlay */}
        <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-black/50 backdrop-blur-sm px-3 py-2 text-xs">
          <p className="font-medium text-muted-foreground mb-1">Orders in real time</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22d3ee]" />
              Regional
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
              Global
            </span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 border-t border-white/10">
        {[
          { label: "Active eSIMs", value: MOCK_KPIS.activeEsims },
          { label: "Sales/min (USD)", value: `$${(MOCK_KPIS.salesPerMin / 1000).toFixed(1)}k` },
          { label: "Orders/min", value: MOCK_KPIS.ordersPerMin },
          { label: "Data (GB/min)", value: MOCK_KPIS.dataConsumed },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="px-5 py-4 text-center"
          >
            <p className="text-xl md:text-2xl font-bold tabular-nums gradient-text">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Region Trends */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Region trends</span>
          <span className="text-xs text-muted-foreground">(as of {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {MOCK_TRENDS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * i }}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="text-sm font-medium">{t.name}</span>
              <span
                className={cn(
                  "text-sm font-semibold flex items-center gap-0.5",
                  t.up ? "text-emerald-400" : "text-red-400"
                )}
              >
                {t.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(t.change)}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
