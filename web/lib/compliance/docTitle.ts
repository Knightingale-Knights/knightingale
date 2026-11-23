import { callTool } from "@/lib/ai/tool";
// Names an uploaded qualification document (e.g. "Certificate III in Individual Support (CHC33021)")
// so the office email says which one it is. Never throws; null when it can't tell.
export async function readDocTitle(bytes: Buffer, mime: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const data = bytes.toString("base64");
  const docBlock = mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
    : mime.startsWith("image/") ? { type: "image", source: { type: "base64", media_type: mime, data } } : null;
  if (!docBlock) return null;
  try {
    const r = await callTool<{ title?: unknown }>({
      tool: {
        name: "record_title",
        description: "Records the name of the qualification on the document.",
        input_schema: {
          type: "object",
          properties: { title: { type: ["string", "null"], description: "The qualification's name as printed, with its course code if shown, e.g. 'Certificate III in Individual Support (CHC33021)'. Null if unclear." } },
          required: ["title"],
        },
      },
      content: [docBlock], prompt: "What qualification is this certificate or transcript for?", maxTokens: 300,
    });
    const t = r.ok ? r.input.title : null;
    return typeof t === "string" && t.trim() ? t.trim().slice(0, 150) : null;
  } catch {
    return null;
  }
}
