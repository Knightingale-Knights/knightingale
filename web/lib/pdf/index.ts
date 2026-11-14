// Wraps the existing pdfmake invoice designs (copied from the `invoice` repo).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const residential = require("./invoiceDoc.cjs") as { generatePdfBase64: (d: unknown) => Promise<string> };
const ndis = require("./ndisInvoiceDoc.cjs") as { generatePdfBase64: (d: unknown) => Promise<string> };

export type ResidentialPdfData = {
  invoice_number: string; period_ending: string; invoice_date: string; payment_terms: string; due_date: string;
  location_name: string; location_address: string; line_items: unknown[];
};
export type NdisPdfData = Omit<ResidentialPdfData, "line_items"> & {
  participant: string; ndis_number: string; shift_items: unknown[]; travel_items: unknown[];
};

export const residentialPdf = (d: ResidentialPdfData) => residential.generatePdfBase64(d);
export const ndisPdf = (d: NdisPdfData) => ndis.generatePdfBase64(d);
