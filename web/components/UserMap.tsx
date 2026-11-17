"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapPoint } from "@/lib/map/data";

type G = typeof google;
declare const google: any; // eslint-disable-line @typescript-eslint/no-explicit-any

const TYPES: { key: string; label: string; color: string }[] = [
  { key: "carer", label: "Carers", color: "#1a1917" },
  { key: "participant", label: "Participants", color: "#8a3a2e" },
  { key: "location", label: "Facilities", color: "#2f5d8a" },
  { key: "resident", label: "Coordinators", color: "#8a7348" },
];
const MELBOURNE = { lat: -37.8136, lng: 144.9631 };

let loading: Promise<void> | null = null;
function loadMaps(key: string) {
  if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps did not load."));
    document.head.appendChild(s);
  });
  return loading;
}

const hrefFor = (p: MapPoint) =>
  p.type === "participant" ? `/participants/${p.id}` : p.type === "carer" ? `/compliance/${p.id}` : null;

export function UserMap({ points, apiKey }: { points: MapPoint[]; apiKey: string }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const markers = useRef<{ p: MapPoint; m: any }[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [show, setShow] = useState<Record<string, boolean>>(Object.fromEntries(TYPES.map((t) => [t.key, true])));
  const [error, setError] = useState("");
  const counts = useMemo(() => Object.fromEntries(TYPES.map((t) => [t.key, points.filter((p) => p.type === t.key).length])), [points]);

  useEffect(() => {
    if (!apiKey) { setError("No Google Maps key is set."); return; }
    loadMaps(apiKey).then(() => {
      const g = google as G;
      map.current = new g.maps.Map(box.current!, { center: MELBOURNE, zoom: 10, mapTypeControl: true, streetViewControl: false, fullscreenControl: true });
      const info = new g.maps.InfoWindow();
      markers.current = points.map((p) => {
        const t = TYPES.find((x) => x.key === p.type);
        const m = new g.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: map.current,
          title: p.name,
          icon: { path: g.maps.SymbolPath.CIRCLE, scale: 7, fillColor: t?.color ?? "#6e6a62", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
        });
        m.addListener("click", () => {
          const div = document.createElement("div");
          div.className = "map-info";
          const name = document.createElement(hrefFor(p) ? "a" : "strong");
          name.textContent = p.name;
          if (hrefFor(p)) (name as HTMLAnchorElement).href = hrefFor(p)!;
          const meta = document.createElement("span");
          meta.textContent = [t?.label.replace(/s$/, ""), p.roles.map((r) => r.toUpperCase()).join(", ")].filter(Boolean).join(" · ");
          const addr = document.createElement("span");
          addr.textContent = p.address;
          div.append(name, meta, addr);
          info.setContent(div);
          info.open({ map: map.current, anchor: m });
        });
        return { p, m };
      });
    }).catch((e) => setError(String(e.message ?? e)));
  }, [apiKey, points]);

  useEffect(() => {
    for (const { p, m } of markers.current) m.setVisible(show[p.type] ?? true);
  }, [show]);

  const fitAll = () => {
    const g = google as G;
    const b = new g.maps.LatLngBounds();
    markers.current.filter(({ m }) => m.getVisible()).forEach(({ m }) => b.extend(m.getPosition()));
    if (!b.isEmpty()) map.current.fitBounds(b);
  };

  return (
    <div className="usermap">
      <div className="map-bar">
        {TYPES.filter((t) => counts[t.key]).map((t) => (
          <label key={t.key} className="check">
            <input type="checkbox" checked={show[t.key]} onChange={(e) => setShow({ ...show, [t.key]: e.target.checked })} />
            <span className="dot" style={{ background: t.color }} />{t.label} ({counts[t.key]})
          </label>
        ))}
        <button type="button" className="secondary" onClick={() => { map.current?.setCenter(MELBOURNE); map.current?.setZoom(10); }}>Melbourne</button>
        <button type="button" className="secondary" onClick={fitAll}>Show all</button>
      </div>
      {error && <p className="banner error">{error}</p>}
      <div ref={box} className="map-box" />
    </div>
  );
}
