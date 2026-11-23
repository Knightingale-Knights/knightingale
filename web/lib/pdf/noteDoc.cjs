// A progress note as a PDF, attached to the escalation alert email.
// Same fonts and palette as the Supports Summary PDF.
const path = require("path");
const PdfPrinter = require("pdfmake");

const fontPath = (f) => path.join(process.cwd(), "lib", "pdf", "fonts", f);
const FONTS = {
  Newsreader: { normal: fontPath("Newsreader-Light.ttf"), italics: fontPath("Newsreader-LightItalic.ttf"), bold: fontPath("Newsreader-Regular.ttf"), bolditalics: fontPath("Newsreader-LightItalic.ttf") },
  Inter: { normal: fontPath("Inter-Regular.ttf"), bold: fontPath("Inter-SemiBold.ttf"), italics: fontPath("Inter-Regular.ttf"), bolditalics: fontPath("Inter-SemiBold.ttf") },
};
const col = { ink: "#1B1A18", body: "#2A2926", faint: "#9A968E", hairline: "#DAD6CE", accent: "#8E3B2E" };

const eyebrow = (text, color = col.faint) => ({ text: String(text || "").toUpperCase(), font: "Inter", fontSize: 7, characterSpacing: 2.2, color, margin: [0, 14, 0, 6] });
const para = (text) => ({ text: text || "", font: "Inter", fontSize: 10.5, lineHeight: 1.55, color: col.body, margin: [0, 0, 0, 8] });

/** { participant, carer, date, summary, comms, bestDay, reasons[] } -> base64 PDF */
async function buildNotePdf(n) {
  const content = [
    { text: "KNIGHTINGALE", font: "Inter", fontSize: 8, characterSpacing: 3, color: col.ink, margin: [0, 0, 0, 18] },
    { text: "Progress Note", font: "Newsreader", fontSize: 26, color: col.ink, margin: [0, 0, 0, 14] },
    {
      table: { widths: [90, "*"], body: [["Participant", n.participant || ""], ["Carer", n.carer || ""], ["Date", n.date || ""]].map(([k, v]) => [
        { text: k, font: "Inter", fontSize: 9, color: col.faint }, { text: v, font: "Inter", fontSize: 10, color: col.body },
      ]) },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => col.hairline, paddingTop: () => 6, paddingBottom: () => 6 },
    },
  ];
  if (n.reasons && n.reasons.length) {
    content.push(eyebrow("Why the alert was sent", col.accent));
    content.push({ ul: n.reasons.map((r) => ({ text: r, font: "Inter", fontSize: 10.5, lineHeight: 1.5, color: col.body })), margin: [0, 0, 0, 8] });
  }
  content.push(eyebrow("Shift summary"), para(n.summary));
  if (n.comms) content.push(eyebrow("Communication book"), para(n.comms));
  if (n.bestDay) content.push(eyebrow("Best day"), para(n.bestDay));

  const printer = new PdfPrinter(FONTS);
  const doc = printer.createPdfKitDocument({ pageSize: "A4", pageMargins: [56, 56, 56, 56], content, defaultStyle: { font: "Inter" } });
  const chunks = [];
  return new Promise((resolve, reject) => {
    doc.on("data", (d) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);
    doc.end();
  });
}

module.exports = { buildNotePdf };
