// The Supports Summary PDF: the monthly deck's design (support-summary/lib/pptx.js) as wide PDF pages, one slide per page.
// Used by the monthly coordinator email and the "About" button alike.
const PdfPrinter = require("pdfmake");

// Knightingale brand (from support-summary/lib/theme.js).
const col = {
  forest: "#213530", bodyText: "#4A4A45", mutedText: "#6B6B64", softGray: "#8A8778", hairline: "#E3E1DB", tableBg: "#F8F6F3"
};

// Standard PDF fonts (no font files needed on Vercel). Times stands in for Georgia, Helvetica for Arial.
const FONTS = {
  Times: { normal: "Times-Roman", bold: "Times-Bold", italics: "Times-Italic", bolditalics: "Times-BoldItalic" },
  Helvetica: { normal: "Helvetica", bold: "Helvetica-Bold", italics: "Helvetica-Oblique", bolditalics: "Helvetica-BoldOblique" }
};

// The deck is 10 x 5.63 inches.
const IN = 72;
const PAGE_W = 10 * IN;
const PAGE_H = 5.63 * IN;
const MX = 0.4 * IN;
const CONTENT_W = PAGE_W - MX * 2;
const LS = 1.5;
const SESSIONS_PER_SLIDE = 8;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Wordmark, eyebrow label on the right, thin forest rule beneath: the top of every slide.
function masthead(eyebrow, first) {
  return [
    {
      columns: [
        { text: "knightingale", font: "Times", fontSize: 18, color: col.forest, width: "*" },
        { text: String(eyebrow || "").toUpperCase(), font: "Helvetica", fontSize: 9, characterSpacing: 2, color: col.softGray, alignment: "right", width: 300, margin: [0, 5, 0, 0] }
      ],
      pageBreak: first ? undefined : "before"
    },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 1, lineColor: col.forest }], margin: [0, 10, 0, 18] }
  ];
}

const title = (text, size) => ({ text: text || "", font: "Times", fontSize: size, color: col.forest, lineHeight: 1.2, margin: [0, 0, 0, 14] });
const body = (text, size = 14) => ({ text: text || "", font: "Helvetica", fontSize: size, color: col.bodyText, lineHeight: LS });
const bullets = (items) => ({ ul: (items || []).map((t) => body(t, 13)), markerColor: col.forest });

function titleSlide(participantName, reportPeriod) {
  return [
    ...masthead("Support Summary", true),
    { text: "Supports Summary", font: "Times", fontSize: 36, color: col.forest, margin: [0, 34, 0, 16] },
    { text: participantName || "", font: "Helvetica", fontSize: 20, color: col.bodyText, margin: [0, 0, 0, 8] },
    reportPeriod ? { text: reportPeriod, font: "Helvetica", fontSize: 12, color: col.mutedText } : ""
  ];
}

function sessionSlides(sessions) {
  const groups = chunk(sessions || [], SESSIONS_PER_SLIDE);
  return groups.flatMap((group, idx) => [
    ...masthead(groups.length > 1 ? `Session Log ${idx + 1}/${groups.length}` : "Session Log"),
    {
      table: {
        headerRows: 1,
        widths: [1.3 * IN - 10, "*"],
        body: [
          [
            { text: "Date", bold: true, fontSize: 11, color: col.forest },
            { text: "Summary", bold: true, fontSize: 11, color: col.forest }
          ],
          ...group.map((s) => [
            { text: s.date || "", fontSize: 10, color: col.bodyText },
            { text: s.summary || "", fontSize: 10, color: col.bodyText, lineHeight: 1.3 }
          ])
        ]
      },
      layout: {
        fillColor: () => col.tableBg,
        hLineWidth: () => 1,
        vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length ? 0 : 0.5),
        hLineColor: () => col.hairline,
        vLineColor: () => col.hairline,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 5,
        paddingBottom: () => 5
      },
      font: "Helvetica"
    }
  ]);
}

async function buildSupportSummaryPdf({ participantName, reportPeriod, content }) {
  const c = content || {};
  const slides = [
    ...titleSlide(participantName, reportPeriod),
    ...masthead("Overview"), title("Overview", 24), body(c.overview),
    ...sessionSlides(c.sessions),
    ...(c.summaryOfWork || []).flatMap((s) => [...masthead("Summary of Work"), title(s.heading, 22), body(s.body)]),
    ...masthead("Observations & Recommendations"), title("Key Observations", 22), bullets(c.keyObservations),
    ...masthead("Observations & Recommendations"), title("Recommendations", 22), bullets(c.recommendations)
  ];

  const docDefinition = {
    pageSize: { width: PAGE_W, height: PAGE_H },
    pageMargins: [MX, 0.3 * IN, MX, 0.35 * IN],
    info: { title: `${participantName || "Participant"} Supports Summary`, author: "Knightingale" },
    defaultStyle: { font: "Helvetica", color: col.bodyText },
    content: slides
  };

  const printer = new PdfPrinter(FONTS);
  const doc = printer.createPdfKitDocument(docDefinition);
  const chunks = [];
  return new Promise((resolve, reject) => {
    doc.on("data", (d) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);
    doc.end();
  });
}

module.exports = { buildSupportSummaryPdf };
