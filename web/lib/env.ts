// Settings read from environment variables, with the defaults Bubble and CarerTexts used.
export const env = {
  // THE SWITCH. LAUNCHED=yes makes the new app the live system in one go: texts and automatic emails go out
  // from here, nothing is written back to Bubble, Klarra's checks read this app's roster, and links point at
  // knightingale.com.au. Leave it unset until Bubble is frozen and the domain points at Vercel.
  get launched() { return process.env.LAUNCHED === "yes"; },

  postmarkToken: process.env.POSTMARK_TOKEN ?? "",
  postmarkTemplateAlias: process.env.POSTMARK_TEMPLATE_ALIAS ?? "invoice",
  fromEmail: process.env.INVOICE_FROM_EMAIL ?? "paul@knightingale.com.au",
  ccEmail: process.env.INVOICE_CC_EMAIL ?? "care@knightingale.com.au",
  residentialTo: process.env.RESIDENTIAL_INVOICE_TO ?? "care@knightingale.com.au",
  ndiaTo: process.env.NDIA_INVOICE_TO ?? "care@knightingale.com.au",
  wintringhamTo: process.env.WINTRINGHAM_CSV_TO ?? "",
  defaultPaymentTerms: process.env.DEFAULT_PAYMENT_TERMS ?? "14 days",

  // Carer texts. Nothing is sent unless SMS_MODE=live.
  get smsMode() { return process.env.LAUNCHED === "yes" || process.env.SMS_MODE === "live" ? "live" : "dry"; },
  get onlyPhone() { return process.env.ONLY_PHONE ?? ""; },
  get notes2Enabled() { return process.env.NOTES_2_ENABLED === "1"; },
  get twilioSid() { return process.env.TWILIO_ACCOUNT_SID ?? ""; },
  get twilioToken() { return process.env.TWILIO_AUTH_TOKEN ?? ""; },
  get twilioFrom() { return process.env.TWILIO_FROM ?? "+61483931556"; },
  get publicBaseUrl() { return (process.env.LAUNCHED === "yes" ? "https://knightingale.com.au" : process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, ""); },
  get linkSecret() { return process.env.LINK_SECRET ?? ""; },
  get klarraSecret() { return process.env.KLARRA_SHARED_SECRET ?? ""; },
  get cronSecret() { return process.env.CRON_SECRET ?? ""; },
  // Facility bookings text this number (the office), as Bubble did.
  // Server-side Google Maps key (Distance Matrix and Places). Needs no HTTP referrer restriction.
  get googleMapsKey() { return process.env.GOOGLE_MAPS_API_KEY ?? ""; },
  // Automatic emails (such as the daily document expiry email) only go out when AUTOMATIONS=live, so Bubble and the new app don't both send.
  get automationsLive() { return process.env.LAUNCHED === "yes" || process.env.AUTOMATIONS === "live"; },
  get complianceAlertTo() { return process.env.COMPLIANCE_ALERT_TO ?? "paul@knightingale.com.au"; },
  get bookingAlertTo() { return process.env.BOOKING_ALERT_TO ?? "0426512584"; },
};
