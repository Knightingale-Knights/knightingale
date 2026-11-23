// Calls Claude with one tool and returns that tool's input.
// The current model rejects a forced tool_choice ("tool"/"any"), so the tool is offered with "auto"
// and the prompt asks for it; a JSON reply in plain text is accepted as a fallback.
export type ToolDef = { name: string; description: string; input_schema: Record<string, unknown> };
export type ToolResult<T> = { ok: true; input: T } | { ok: false; reason: string };

export async function callTool<T = Record<string, unknown>>(opts: {
  tool: ToolDef; content: unknown[]; prompt: string; maxTokens: number;
}): Promise<ToolResult<T>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: "no_key" };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: opts.maxTokens,
      tools: [opts.tool],
      tool_choice: { type: "auto" },
      messages: [{
        role: "user",
        content: [...opts.content, { type: "text", text: `${opts.prompt}\n\nReply only by calling the ${opts.tool.name} tool, once.` }],
      }],
    }),
  });
  if (!res.ok) {
    console.error(`Claude ${opts.tool.name}`, res.status, (await res.text()).slice(0, 500));
    return { ok: false, reason: `ai_error_${res.status}` };
  }
  const j = (await res.json()) as { content?: { type: string; name?: string; input?: T; text?: string }[] };
  const use = j.content?.find((b) => b.type === "tool_use" && b.name === opts.tool.name);
  if (use?.input) return { ok: true, input: use.input };
  const text = j.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n") ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return { ok: true, input: JSON.parse(m[0]) as T }; } catch { /* fall through */ }
  }
  console.error(`Claude ${opts.tool.name}: no tool call`, text.slice(0, 300));
  return { ok: false, reason: "ai_no_answer" };
}
