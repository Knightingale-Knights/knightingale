"use client";
import { useEffect, useRef, useState } from "react";
import { travelAction } from "./actions";
import { AddressInput } from "./extras";
import { PendingButton } from "@/components/PendingButton";

declare const google: any; // eslint-disable-line @typescript-eslint/no-explicit-any

const RATE = 1; // dollars per km, same as TRAVEL_RATE
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

/** Decodes a Google encoded polyline into points. */
function decode(str: string) {
  const pts: { lat: number; lng: number }[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const k of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (k === 0) lat += d; else lng += d;
    }
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pts;
}

type Route = { km: number; polyline: string | null };

/** Add trip: From and To, a map of the route, the reimbursement, and Add this trip. */
export function TripPlanner({ shiftId, to, mapsKey }: { shiftId: string; to: string; mapsKey: string }) {
  const [from, setFrom] = useState("");
  const [dest, setDest] = useState(to);
  const [route, setRoute] = useState<Route | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const drawn = useRef<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    if (!mapsKey || !box.current) return;
    loadMaps(mapsKey).then(() => {
      if (!map.current && box.current) {
        map.current = new google.maps.Map(box.current, { center: MELBOURNE, zoom: 11, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative" });
      }
    }).catch(() => {});
  }, [mapsKey]);

  useEffect(() => {
    setRoute(null);
    setErr(null);
    if (from.trim().length < 5 || dest.trim().length < 5) return;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(dest)}`);
        const j = await r.json();
        if (r.ok) setRoute(j as Route);
        else setErr((j as { error?: string }).error ?? "We couldn't work out the distance.");
      } catch {
        setErr("We couldn't work out the distance.");
      }
      setBusy(false);
    }, 700);
    return () => clearTimeout(t);
  }, [from, dest]);

  useEffect(() => {
    drawn.current.forEach((d) => d.setMap(null));
    drawn.current = [];
    if (!map.current || !route?.polyline) return;
    const path = decode(route.polyline);
    if (path.length < 2) return;
    const line = new google.maps.Polyline({ path, map: map.current, strokeColor: "#1a1917", strokeWeight: 4, strokeOpacity: 0.85 });
    const a = new google.maps.Marker({ position: path[0], map: map.current, label: "A" });
    const b = new google.maps.Marker({ position: path[path.length - 1], map: map.current, label: "B" });
    drawn.current = [line, a, b];
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.current.fitBounds(bounds, 30);
  }, [route]);

  return (
    <form action={travelAction} className="trip">
      <input type="hidden" name="id" value={shiftId} />
      {mapsKey && <div ref={box} className="trip-map" />}
      <AddressInput name="from" label="From" listId="from-list" onValue={setFrom} />
      <AddressInput name="to" label="To" listId="to-list" defaultValue={to} onValue={setDest} />
      <p className="trip-pay">
        {busy ? "Working out the distance…" : route ? `Reimbursement = $${(route.km * RATE).toFixed(2)} (${route.km.toFixed(1)} km)` : "Reimbursement = $0.00"}
      </p>
      {err && <p className="banner error">{err}</p>}
      <PendingButton className="big" pending="Adding…">Add this trip</PendingButton>
    </form>
  );
}
