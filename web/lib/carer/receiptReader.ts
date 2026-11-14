// Reads a receipt's final total with Claude, using the same prompt as the onboarding repo's extract-receipt-total.
export type ReceiptReading = { total: number | null; merchant: string | null; needsReview: boolean; reason: string | null };

const PROMPT =
  "Determine whether this is genuinely a receipt/invoice/proof-of-purchase. If so, find the FINAL total amount actually paid, not a subtotal before tax, not a single line item if there are several, and record it as a plain number. If several distinct totals appear (e.g. multiple separate transactions on one page), use the one most clearly labelled as the final/grand total. If it is not a receipt at all, set is_receipt to false and explain what it actually is.";

const TOOL = {
  name: "record_receipt_total",
  description: "Records the total amount paid on a receipt or invoice.",
  input_schema: {
    type: "object",
    properties: {
      is_receipt: { type: "boolean", description: "True if this document is genuinely a receipt, invoice, or proof-of-purchase showing an amount paid." },
      mismatch_reason: { type: "string", description: "If is_receipt is false, briefly explain what the document actually is." },
      total_amount: { type: ["number", "null"], description: "The final total amount actually paid. Plain number, up to 2 decimal places. Null if not a receipt or no total is legible." },
      currency: { type: "string", description: "Three-letter currency code. Default to AUD if not stated and the receipt looks Australian." },
      merchant_name: { type: "string", description: "Name of the merchant on the receipt, if visible." },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
    },
    required: ["is_receipt", "total_amount", "confidence"],
  },
};

/** Returns null when no API key is set (the receipt is kept and the office checks it). */
export async function readReceipt(bytes: Buffer, mime: string): Promise<ReceiptReading | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const data = bytes.toString("base64");
  const doc = mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
    : { type: "image", source: { type: "base64", media_type: mime, data } };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 300,
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [{ role: "user", content: [doc, { type: "text", text: PROMPT }] }],
      }),
    });
    if (!res.ok) return { total: null, merchant: null, needsReview: true, reason: `ai_error_${res.status}` };
    const j = (await res.json()) as { content?: { type: string; input?: Record<string, unknown> }[] };
    const r = j.content?.find((b) => b.type === "tool_use")?.input ?? {};
    const total = typeof r.total_amount === "number" && Number.isFinite(r.total_amount) && r.total_amount >= 0 ? Math.round(r.total_amount * 100) / 100 : null;
    const merchant = typeof r.merchant_name === "string" ? r.merchant_name.slice(0, 200) : null;
    if (r.is_receipt === false) return { total: null, merchant, needsReview: true, reason: "not_a_receipt" };
    if (total == null || r.confidence === "low") return { total, merchant, needsReview: true, reason: "low_confidence" };
    return { total, merchant, needsReview: false, reason: null };
  } catch (e) {
    console.error("receipt read failed", e);
    return { total: null, merchant: null, needsReview: true, reason: "ai_error" };
  }
}
