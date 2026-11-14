import { klarraHandler } from "@/lib/texts/klarraRoute";

export const dynamic = "force-dynamic";
// Klarra: any carer text. Body: { phone, intent: "checkin" | "checkout" | "auto" }
export const POST = klarraHandler();
