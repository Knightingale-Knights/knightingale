import { klarraHandler } from "@/lib/texts/klarraRoute";

export const dynamic = "force-dynamic";
// Klarra: a carer texts for their check in link. Body: { phone }
export const POST = klarraHandler("checkin");
