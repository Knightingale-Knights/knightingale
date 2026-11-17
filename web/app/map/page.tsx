import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { UserMap } from "@/components/UserMap";
import { mapPoints } from "@/lib/map/data";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const staff = await requireStaff();
  const points = await mapPoints();
  // A browser key (restricted to this site) is preferred; the server key works while testing.
  const key = process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
  return (
    <div className="shell">
      <TopBar section="/map" email={staff.email} />
      <main className="page wide">
        <h1>Map</h1>
        <p className="lede">{points.length} active people with an address.</p>
        <UserMap points={points} apiKey={key} />
      </main>
    </div>
  );
}
