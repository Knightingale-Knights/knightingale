// Everyone with an address on the admin map: active, account status yes, address set (as in Bubble).
import { sql } from "@/lib/db";

export type MapPoint = { id: string; name: string; type: string; roles: string[]; lat: number; lng: number; address: string };

export async function mapPoints(): Promise<MapPoint[]> {
  const rows = await sql<{ id: string; name: string; type: string; roles: string[] | null; lat: string; lng: string; address: string | null }[]>`
    select id, trim(concat_ws(' ', first_name, last_name)) as name, account_type as type, roles,
           address->>'lat' as lat, address->>'lng' as lng, address->>'address' as address
      from app.users
     where coalesce(active, false) and coalesce(account_status, false)
       and address is not null and address ? 'lat' and address ? 'lng'
     order by first_name, last_name`;
  return rows
    .map((r) => ({ id: r.id, name: r.name || "(no name)", type: r.type, roles: r.roles ?? [], lat: Number(r.lat), lng: Number(r.lng), address: r.address ?? "" }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}
