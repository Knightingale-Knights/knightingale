// Names an uploaded qualification document (e.g. "Certificate III in Individual Support (CHC33021)")
// so the office email says which one it is. Never throws; null when it can't tell.
export async function readDocTitle(bytes: Buffer, mime: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const data = bytes.toString("base64");
  const docBlock = mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
    : mime.startsWith("image/") ? { type: "image", source: { type: "base64", media_type: mime, data } } : null;
  if (!docBlock) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 100,
        tools: [{
          name: "record_title",
          description: "Records the name of the qualification on the document.",
          input_schema: {
            type: "object",
            properties: { title: { type: ["string", "null"], description: "The qualification's name as printed, with its course code if shown, e.g. 'Certificate III in Individual Support (CHC33021)'. Null if unclear." } },
            required: ["title"],
          },
        }],
        tool_choice: { type: "tool", name: "record_title" },
        messages: [{ role: "user", content: [docBlock, { type: "text", text: "What qualification is this certificate or transcript for?" }] }],
      }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { content?: { type: string; input?: { title?: unknown } }[] };
    const t = j.content?.find((b) => b.type === "tool_use")?.input?.title;
    return typeof t === "string" && t.trim() ? t.trim().slice(0, 150) : null;
  } catch {
    return null;
  }
}
