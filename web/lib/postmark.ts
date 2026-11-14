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

/** The same Postmark "invoice" template Bubble used. */
export function sendInvoiceEmail(o: {
  to: string; participant: string; locationName: string; invoiceNumber: string; attachments: Attachment[];
}) {
  return post("email/withTemplate", {
    From: env.fromEmail,
    To: o.to,
    // Skip the copy when it would go to the same inbox twice.
    ...(o.to.trim().toLowerCase() === env.ccEmail.toLowerCase() ? {} : { Cc: env.ccEmail }),
    TemplateAlias: env.postmarkTemplateAlias,
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

export function sendPlainEmail(o: { to: string; subject: string; text: string; attachments: Attachment[] }) {
  return post("email", {
    From: env.fromEmail, To: o.to, Subject: o.subject, TextBody: o.text, Attachments: o.attachments, MessageStream: "outbound",
  });
}
