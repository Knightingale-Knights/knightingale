import { env } from "@/lib/env";

type Attachment = { Name: string; Content: string; ContentType: string };

async function post(path: string, body: unknown) {
  if (!env.postmarkToken) throw new Error("POSTMARK_TOKEN is not set");
  const res = await fetch(`https://api.postmarkapp.com/${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": env.postmarkToken },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Postmark ${res.status}: ${out?.Message ?? "send failed"}`);
  return out as { MessageID: string };
}

/**
 * Emails an invoice with the Postmark invoice template Bubble used (template 40979457).
 * If that template can't be used on this Postmark server, sends a plain email with the
 * same attachments instead, so the invoice still goes out.
 */
export async function sendInvoiceEmail(o: {
  to: string; participant: string; locationName: string; invoiceNumber: string; attachments: Attachment[];
}) {
  // Skip the copy when it would go to the same inbox twice.
  const cc = o.to.trim().toLowerCase() === env.ccEmail.toLowerCase() ? {} : { Cc: env.ccEmail };
  const templateId = Number(process.env.POSTMARK_INVOICE_TEMPLATE_ID ?? 40979457);
  try {
    return await post("email/withTemplate", {
      From: env.fromEmail,
      To: o.to,
      ...cc,
      ...(process.env.POSTMARK_TEMPLATE_ALIAS ? { TemplateAlias: env.postmarkTemplateAlias } : { TemplateId: templateId }),
      TemplateModel: {
        participant: o.participant,
        location_name: o.locationName,
        invoice_number: o.invoiceNumber,
        support_url: "https://knightingale.com.au",
        company_name: "Knightingale",
        company_address: "Melbourne, Victoria",
      },
      Attachments: o.attachments,
      MessageStream: "outbound",
    });
  } catch (e) {
    if (!/Postmark 4\d\d: .*template/i.test(String((e as Error).message))) throw e;
    console.error("invoice template unavailable, sending plain email", e);
    return post("email", {
      From: env.fromEmail,
      To: o.to,
      ...cc,
      Subject: `Invoice ${o.invoiceNumber} from Knightingale${o.participant ? ` - ${o.participant}` : ""}`,
      TextBody: `Hello,\n\nPlease find attached invoice ${o.invoiceNumber}${o.participant ? ` for ${o.participant}` : ""}${o.locationName ? ` (${o.locationName})` : ""}.\n\nIf you have any questions, please reply to this email.\n\nKind regards,\nKnightingale\nhttps://knightingale.com.au`,
      Attachments: o.attachments,
      MessageStream: "outbound",
    });
  }
}

export function sendPlainEmail(o: { to: string; subject: string; text: string; attachments: Attachment[]; cc?: string; from?: string }) {
  return post("email", {
    From: o.from ?? env.fromEmail, To: o.to, ...(o.cc ? { Cc: o.cc } : {}), Subject: o.subject, TextBody: o.text,
    Attachments: o.attachments, MessageStream: "outbound",
  });
}

/** Sends a Postmark template by its ID. */
export function sendTemplateEmail(templateId: number, to: string, model: Record<string, unknown>, from = env.fromEmail) {
  return post("email/withTemplate", { TemplateId: templateId, From: from, To: to, TemplateModel: model, MessageStream: "outbound" });
}
