// Settings read from environment variables, with the defaults Bubble used.
export const env = {
  postmarkToken: process.env.POSTMARK_TOKEN ?? "",
  postmarkTemplateAlias: process.env.POSTMARK_TEMPLATE_ALIAS ?? "invoice",
  fromEmail: process.env.INVOICE_FROM_EMAIL ?? "paul@knightingale.com.au",
  ccEmail: process.env.INVOICE_CC_EMAIL ?? "care@knightingale.com.au",
  residentialTo: process.env.RESIDENTIAL_INVOICE_TO ?? "care@knightingale.com.au",
  ndiaTo: process.env.NDIA_INVOICE_TO ?? "paul@knightingale.com.au",
  wintringhamTo: process.env.WINTRINGHAM_CSV_TO ?? "",
  rosterUrl: process.env.ROSTER_URL ?? "https://roster-liart-three.vercel.app/api/send-roster",
  bubbleToken: process.env.BUBBLE_API_TOKEN ?? "",
  bubbleBase: (process.env.BUBBLE_BASE_URL ?? "https://knightingale.com.au/api/1.1/obj").replace(/\/$/, ""),
  defaultPaymentTerms: process.env.DEFAULT_PAYMENT_TERMS ?? "14 days",
};
