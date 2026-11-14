// Settings read from environment variables, with the defaults Bubble used.
export const env = {
  postmarkToken: process.env.POSTMARK_TOKEN ?? "",
  postmarkTemplateAlias: process.env.POSTMARK_TEMPLATE_ALIAS ?? "invoice",
  fromEmail: process.env.INVOICE_FROM_EMAIL ?? "paul@knightingale.com.au",
  ccEmail: process.env.INVOICE_CC_EMAIL ?? "care@knightingale.com.au",
  residentialTo: process.env.RESIDENTIAL_INVOICE_TO ?? "care@knightingale.com.au",
  ndiaTo: process.env.NDIA_INVOICE_TO ?? "care@knightingale.com.au",
  wintringhamTo: process.env.WINTRINGHAM_CSV_TO ?? "",
  defaultPaymentTerms: process.env.DEFAULT_PAYMENT_TERMS ?? "14 days",
};
