import { env } from "@/lib/env";

export type SendResult = { dryRun: boolean; sid: string | null };
export type Sender = (to: string, body: string) => Promise<SendResult>;

/** Sends through Twilio only when SMS_MODE=live. Otherwise logs the text and sends nothing. */
export const sendSms: Sender = async (to, body) => {
  if (env.smsMode !== "live") {
    console.log(`[DRY RUN] SMS to ${to}: ${body}`);
    return { dryRun: true, sid: null };
  }
  const { twilioSid: sid, twilioToken: token, twilioFrom: from } = env;
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${json.message ?? "send failed"}`);
  return { dryRun: false, sid: json.sid ?? null };
};
