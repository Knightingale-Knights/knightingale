// Google Maps calls, made on the server so the key stays private.
import { env } from "@/lib/env";

export class MapsError extends Error {}

/** Driving distance in km (1 decimal place), as Bubble worked it out with the Distance Matrix. */
export async function drivingKm(from: string, to: string): Promise<number> {
  if (!env.googleMapsKey) throw new MapsError("Travel can't be worked out yet. Please contact the office.");
  const u = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  u.search = new URLSearchParams({ origins: from, destinations: to, mode: "driving", region: "au", units: "metric", key: env.googleMapsKey }).toString();
  const res = await fetch(u, { cache: "no-store" });
  const j = (await res.json().catch(() => ({}))) as { status?: string; rows?: { elements?: { status?: string; distance?: { value?: number } }[] }[] };
  const el = j.rows?.[0]?.elements?.[0];
  if (!res.ok || j.status !== "OK" || el?.status !== "OK" || typeof el.distance?.value !== "number") {
    throw new MapsError("We couldn't find a driving route between those addresses. Check them and try again.");
  }
  return Math.round(el.distance.value / 100) / 10;
}

export type Route = { km: number; polyline: string | null };

/** Driving route: km from the Distance Matrix (as Bubble did), plus the line to draw from Directions when available. */
export async function drivingRoute(from: string, to: string): Promise<Route> {
  const [km, polyline] = await Promise.all([drivingKm(from, to), routeLine(from, to).catch(() => null)]);
  return { km, polyline };
}

async function routeLine(from: string, to: string): Promise<string | null> {
  const u = new URL("https://maps.googleapis.com/maps/api/directions/json");
  u.search = new URLSearchParams({ origin: from, destination: to, mode: "driving", region: "au", key: env.googleMapsKey }).toString();
  const res = await fetch(u, { cache: "no-store" });
  const j = (await res.json().catch(() => ({}))) as { status?: string; routes?: { overview_polyline?: { points?: string } }[] };
  return j.status === "OK" ? j.routes?.[0]?.overview_polyline?.points ?? null : null;
}

/** Address suggestions in Australia for the From and To boxes. */
export async function addressSuggestions(q: string): Promise<string[]> {
  if (!env.googleMapsKey || q.trim().length < 3) return [];
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": env.googleMapsKey, "X-Goog-FieldMask": "suggestions.placePrediction.text.text" },
    body: JSON.stringify({ input: q.trim().slice(0, 200), includedRegionCodes: ["au"], languageCode: "en-AU" }),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = (await res.json().catch(() => ({}))) as { suggestions?: { placePrediction?: { text?: { text?: string } } }[] };
  return (j.suggestions ?? []).map((s) => s.placePrediction?.text?.text).filter((t): t is string => Boolean(t)).slice(0, 5);
}
