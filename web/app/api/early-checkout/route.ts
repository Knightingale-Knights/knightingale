import { klarraHandler } from "@/lib/texts/klarraRoute";

export const dynamic = "force-dynamic";
// Klarra: a carer texts to check out early. Body: { phone }
export const POST = klarraHandler("checkout");
