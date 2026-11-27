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
 * Emails an invoice with the Postmark invoice template Bubble used (template 40979457),
 * always copying care@knightingale.com.au. Never sends without the template: if Postmark
 * refuses, the error is shown and nothing goes out.
 */
export function sendInvoiceEmail(o: {
  to: string; participant: string; locationName: string; invoiceNumber: string; attachments: Attachment[];
}) {
  return post("email/withTemplate", {
    From: env.fromEmail,
    To: o.to,
    Cc: env.ccEmail,
    TemplateId: Number(process.env.POSTMARK_INVOICE_TEMPLATE_ID ?? 40979457),
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
}

export function sendPlainEmail(o: { to: string; subject: string; text: string; html?: string; attachments: Attachment[]; cc?: string; from?: string }) {
  return post("email", {
    From: o.from ?? env.fromEmail, To: o.to, ...(o.cc ? { Cc: o.cc } : {}), Subject: o.subject, TextBody: o.text, ...(o.html ? { HtmlBody: o.html } : {}),
    Attachments: o.attachments, MessageStream: "outbound",
  });
}

/** Sends a Postmark template by its ID. */
export function sendTemplateEmail(templateId: number, to: string, model: Record<string, unknown>, from = env.fromEmail) {
  return post("email/withTemplate", { TemplateId: templateId, From: from, To: to, TemplateModel: model, MessageStream: "outbound" });
}

/** The {{variables}} a Postmark template uses (from its subject, HTML and text), e.g. ["participant", "carer"]. */
export async function templateVariables(templateId: number): Promise<string[]> {
  return (await templateInfo(templateId)).names;
}

/** The template's variables, and which of them its HTML prints raw ({{{name}}}), so they can carry <br>. */
export async function templateInfo(templateId: number): Promise<{ names: string[]; raw: string[] }> {
  if (!env.postmarkToken) throw new Error("POSTMARK_TOKEN is not set");
  const res = await fetch(`https://api.postmarkapp.com/templates/${templateId}`, {
    headers: { Accept: "application/json", "X-Postmark-Server-Token": env.postmarkToken },
  });
  const t = (await res.json().catch(() => ({}))) as { Subject?: string; HtmlBody?: string; TextBody?: string; Message?: string };
  if (!res.ok) throw new Error(`Postmark template ${templateId}: ${t.Message ?? res.status}`);
  const names = new Set<string>();
  for (const m of `${t.Subject ?? ""} ${t.HtmlBody ?? ""} ${t.TextBody ?? ""}`.matchAll(/\{\{\{?\s*[#^/]?\s*([A-Za-z_][\w.]*)\s*\}?\}\}/g)) {
    if (!["each", "if", "unless", "else", "this"].includes(m[1])) names.add(m[1]);
  }
  const raw = [...(t.HtmlBody ?? "").matchAll(/\{\{\{\s*([A-Za-z_][\w.]*)\s*\}\}\}/g)].map((m) => m[1]);
  return { names: [...names], raw };
}

/** Sends a Postmark template with attachments and an optional cc. */
export function sendTemplateWith(o: { templateId: number; to: string; model: Record<string, unknown>; attachments?: Attachment[]; cc?: string; from?: string }) {
  return post("email/withTemplate", {
    TemplateId: o.templateId, From: o.from ?? env.fromEmail, To: o.to, ...(o.cc ? { Cc: o.cc } : {}),
    TemplateModel: o.model, Attachments: o.attachments ?? [], MessageStream: "outbound",
  });
}
