// Reads the expiry date on a compliance document with Claude.
// The tool, rules and prompt are copied from the onboarding repo (api/extract-expiry.js) so results match Bubble's CPR check.
/* eslint-disable */

export const DISALLOWED_CPR_PROVIDERS = ['National CPR Foundation', 'NationalCPRFoundation', 'NCPRF'];

const RTO_COMPLIANCE_NOTE = `For CPR and First Aid competency specifically, only accept a genuine Statement of Attainment issued by an Australian Registered Training Organisation (RTO) for the relevant nationally recognised unit of competency (e.g. HLTAID009 Provide cardiopulmonary resuscitation, HLTAID011 Provide First Aid). Reject a generic online "Certificate of Completion" that references CPR/AED/first aid training but is NOT an RTO Statement of Attainment for one of these units — this includes any document issued by: ${DISALLOWED_CPR_PROVIDERS.join(', ')}. Reject these regardless of what expiry date is printed on them. If a document matches this pattern, set is_expected_document_type to false and explain in mismatch_reason that it is not a recognised RTO qualification.`;

const TOOL = {
            name: 'record_expiry_date',
            description: 'Records the expiry date printed on an identity or compliance document.',
            input_schema: {
              type: 'object',
              properties: {
                is_expected_document_type: {
                  type: 'boolean',
                  description: 'True if the document contains the qualification/type described in document_label anywhere on it — including when it\'s a combined certificate listing several qualifications together (e.g. First Aid + CPR + Basic Life Support on one Statement of Attainment). False only if the document is clearly a different, unrelated document (e.g. a driver\'s licence or passport when a certificate was expected) that does not contain the expected qualification at all.',
                },
                mismatch_reason: {
                  type: 'string',
                  description: 'If is_expected_document_type is false, briefly explain what the document actually appears to be instead. Omit if true.',
                },
                expiry_date: {
                  type: ['string', 'null'],
                  description: 'Expiry date in YYYY-MM-DD format, taken ONLY from a date explicitly printed on the document as an expiry, valid-until, or renewal-due date. Never calculate or infer this from an issue date plus a stated renewal period (e.g. "renew annually") — if no explicit expiry date is printed, this must be null even if an issue date or renewal guidance is present.',
                },
                issue_date: {
                  type: ['string', 'null'],
                  description: 'The issue/completion/attainment/award date in YYYY-MM-DD format, as printed on the document (e.g. "Issue Date: 28 September 2023", "Date of attainment", "Completed on", or the date printed with the issuer\'s signature). If the document shows only one date and it is not an expiry date, that is the issue date. Null only if no such date is printed. Report this even when expiry_date is also found.',
                },
                matched_qualification: {
                  type: 'string',
                  description: 'The exact line/qualification on the document that expiry_date was taken from, e.g. "HLTAID009 - Provide cardiopulmonary resuscitation - 08/10/2026". If the document only has one date, describe that line.',
                },
                document_type: {
                  type: 'string',
                  description: "Best guess at what the document actually is, e.g. 'drivers licence', 'passport', 'first aid certificate'.",
                },
                confidence: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Confidence that expiry_date is correct.',
                },
                nrt_logo_visible: {
                  type: 'boolean',
                  description: 'True if the "Nationally Recognised Training" triangle logo (a stylised triangle made of layered red/green arrow shapes) is visible anywhere on the document. False if not visible, unclear, or cropped out. This is informational only — do not let its absence affect is_expected_document_type.',
                },
              },
              required: ['is_expected_document_type', 'expiry_date', 'confidence', 'matched_qualification', 'nrt_logo_visible'],
            },
          };

function promptFor(document_label: string | undefined) {
  return {
                text: document_label
                  ? `You are verifying an uploaded document against an expected type: "${document_label}".

First, check whether this document genuinely appears to be a certificate, statement, or card that would contain this qualification — not a different, unrelated document (e.g. a driver's licence, passport, or a different certificate entirely) that simply happens to have a date on it somewhere. Training providers often issue a single combined "Statement of Attainment" listing several separate qualifications together (e.g. First Aid, CPR, and Basic Life Support on the same certificate) — this is normal. Do NOT reject it as a mismatch just because it also lists other, unrelated qualifications, or because its overall title/heading doesn't literally say the expected type. What matters is whether the specific qualification described in "${document_label}" is listed anywhere on the document.

${RTO_COMPLIANCE_NOTE}

Date format: these documents are Australian. When a date is written in ambiguous numeric slash format (e.g. "12/09/26"), read it as DD/MM/YYYY (Australian convention), not MM/DD/YYYY — so "12/09/26" means 12 September 2026, not 9 December 2026. Only use MM/DD if the document itself is unambiguously from a US source and other dates on it are spelled out in a way that confirms it (e.g. "Aug 8, 2026").

Separately, check whether the "Nationally Recognised Training" triangle logo is visible anywhere on the document, and report it in nrt_logo_visible. This is informational only — a genuine certificate can have this logo cropped, blurry, or absent from a scan/photo, so its absence must NOT be used to reject an otherwise valid document.

If it does NOT match, set is_expected_document_type to false, briefly explain what it actually is in mismatch_reason, and set expiry_date to null.

If it DOES match: this document may list several qualifications, each with its own date. Read every line first, then find the expiry date that specifically corresponds to "${document_label}" — do not default to the first or most prominent date on the page if it belongs to a different item. Only use a date that is explicitly printed as a calendar date (e.g. "08/10/2026" or "14 August 2024") functioning as an expiry/valid-until/renewal-due date — never calculate one from an issue date plus a stated renewal period (e.g. "renew annually", "recertify within 12 months", a recertification-period table). Many certificates print a generic renewal-guidance table listing periods like "12 months" or "3 years" per unit — that is NOT a calendar date and must NOT be used to produce one; if the only dated thing on the page is an issue date plus this kind of guidance, expiry_date must be null and confidence low, even though the math is tempting. Separately, also report issue_date if the document explicitly prints an issue/completion/attainment date, even when an expiry date was also found. Record which exact line you matched, including the literal date text as printed.`
                  : 'Set is_expected_document_type to true. Find the expiry date on this document and record it — only if it is explicitly printed as an expiry/valid-until date, never calculated from an issue date plus a renewal period. These documents are Australian: read ambiguous numeric dates (e.g. "12/09/26") as DD/MM/YYYY, not MM/DD/YYYY, unless the document is clearly from a US source. Also report issue_date if one is explicitly printed. If multiple dates appear, note which line each belongs to and pick the one that best represents the document\'s overall expiry. If no explicit expiry date is printed, return null and confidence low. Also report whether the "Nationally Recognised Training" triangle logo is visible anywhere on the document (nrt_logo_visible) — informational only, do not let its absence affect your other answers.'
  }.text as string;
}

export type ExpiryReading = {
  success: boolean; needsReview: boolean; reason: string | null; mismatchReason: string | null; documentType: string | null;
  expiryDate: string | null; expirySource: "printed" | "calculated_from_issue_date" | null; issueDate: string | null;
  matchedQualification: string | null; confidence: string | null; warning: string | null;
};

const empty: ExpiryReading = {
  success: false, needsReview: true, reason: null, mismatchReason: null, documentType: null, expiryDate: null,
  expirySource: null, issueDate: null, matchedQualification: null, confidence: null, warning: null,
};

/** Same decisions as the onboarding endpoint, minus the Bubble write. Null when no API key is set. */
/** fromIssueOnly: the expiry is always the issue date plus fallbackMonths (flu: 12 months after it was given), never a printed date. */
export async function readExpiry(bytes: Buffer, mime: string, documentLabel: string, fallbackMonths: number | null, today: string, fromIssueOnly = false): Promise<ExpiryReading | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const data = bytes.toString("base64");
  const docBlock = mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
    : { type: "image", source: { type: "base64", media_type: mime, data } };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 1200, // room for the quoted line and every field; 300 cut readings short
        tools: [TOOL],
        tool_choice: { type: "tool", name: "record_expiry_date" },
        messages: [{ role: "user", content: [docBlock, { type: "text", text: promptFor(documentLabel) }] }],
      }),
    });
    if (!res.ok) {
      console.error("expiry read: Claude", res.status, (await res.text()).slice(0, 500));
      return { ...empty, reason: `ai_error_${res.status}` };
    }
    const j = (await res.json()) as { content?: { type: string; input?: Record<string, any> }[] };
    const input = j.content?.find((b) => b.type === "tool_use")?.input;
    if (!input) return { ...empty, reason: "ai_error" };
    return decide(input, fallbackMonths, today, fromIssueOnly);
  } catch (e) {
    console.error("expiry read failed", e);
    return { ...empty, reason: "ai_error" };
  }
}

/** The onboarding endpoint's checks, in plain code (no date maths left to the model). */
export function decide(input: Record<string, any>, fallbackMonths: number | null, today: string, fromIssueOnly = false): ExpiryReading {
  const { is_expected_document_type, mismatch_reason, expiry_date, issue_date, matched_qualification, document_type, confidence } = input;
  const base = { ...empty, documentType: document_type ?? null, issueDate: issue_date ?? null, matchedQualification: matched_qualification ?? null, confidence: confidence ?? null };
  let trusted: string | null = !fromIssueOnly && typeof expiry_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expiry_date) ? expiry_date : null;
  let warning: string | null = null;
  if (trusted && (!matched_qualification || !String(matched_qualification).includes(trusted.slice(0, 4)))) {
    trusted = null;
    warning = "A printed expiry date was reported but its year did not appear in the quoted line, so it was not trusted.";
  }
  if (!is_expected_document_type) return { ...base, reason: "document_type_mismatch", mismatchReason: mismatch_reason ?? null, warning };
  let final = trusted;
  let source: ExpiryReading["expirySource"] = trusted ? "printed" : null;
  if (!final && typeof issue_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(issue_date) && fallbackMonths) {
    const d = new Date(`${issue_date}T00:00:00.000Z`);
    d.setUTCMonth(d.getUTCMonth() + fallbackMonths);
    final = d.toISOString().slice(0, 10);
    source = "calculated_from_issue_date";
  }
  if (!final || (source === "printed" && confidence === "low")) return { ...base, expiryDate: final, expirySource: source, warning };
  if (final < today) {
    return { ...base, reason: "expired", mismatchReason: `This document is genuine but expired on ${final}. An updated certificate is required.`, expiryDate: final, expirySource: source, warning };
  }
  return { ...base, success: true, needsReview: false, expiryDate: final, expirySource: source, warning };
}
