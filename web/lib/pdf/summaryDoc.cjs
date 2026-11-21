// The Supports Summary PDF, in the same design as the Knightingale Policies (public/docs/policies):
// tall phone-sized pages, a sand cover, Newsreader Light titles and Inter body text.
// Used by the monthly coordinator email and the "About" button alike.
const path = require("path");
const PdfPrinter = require("pdfmake");

const fontPath = (f) => path.join(process.cwd(), "lib", "pdf", "fonts", f);
const FONTS = {
  Newsreader: {
    normal: fontPath("Newsreader-Light.ttf"),
    italics: fontPath("Newsreader-LightItalic.ttf"),
    bold: fontPath("Newsreader-Regular.ttf"),
    bolditalics: fontPath("Newsreader-LightItalic.ttf")
  },
  Inter: {
    normal: fontPath("Inter-Regular.ttf"),
    bold: fontPath("Inter-SemiBold.ttf"),
    italics: fontPath("Inter-Regular.ttf"),
    bolditalics: fontPath("Inter-SemiBold.ttf")
  }
};

// The policies' palette.
const col = {
  cover: "#E7E4DE", paper: "#F6F4F0", ink: "#1B1A18", body: "#2A2926", muted: "#6B6862", faint: "#9A968E",
  rule: "#1B1A18", hairline: "#DAD6CE", accent: "#8E3B2E"
};

const PAGE_W = 540;
const PAGE_H = 959.04;
const MX = 44;
const CONTENT_W = PAGE_W - MX * 2;
const ADDRESS = "22 Kavanagh St, Southbank VIC 3006";

const eyebrow = (text, color = col.faint, margin = [0, 0, 0, 10]) =>
  ({ text: String(text || "").toUpperCase(), font: "Inter", fontSize: 6.5, characterSpacing: 2.2, color, margin });
const rule = (color = col.rule, width = 0.8, margin = [0, 18, 0, 22]) =>
  ({ canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: width, lineColor: color }], margin });
const para = (text, margin = [0, 0, 0, 10]) =>
  ({ text: text || "", font: "Inter", fontSize: 10.5, lineHeight: 1.6, color: col.body, margin });
const subhead = (text) => ({ text: text || "", font: "Newsreader", bold: true, fontSize: 16, color: col.ink, margin: [0, 6, 0, 10] });
/** The first paragraph as a serif lead, like the policies' opening lines. */
const lead = (text) => ({ text: text || "", font: "Newsreader", fontSize: 15, lineHeight: 1.45, color: col.muted, margin: [0, 0, 0, 16] });
const paras = (text) => String(text || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean).map((t) => para(t));

/** "SECTION 01", a large light serif title and a dark rule: the top of each section, on a new page. */
function sectionHead(n, title) {
  return [
    eyebrow(`Section ${String(n).padStart(2, "0")}`, col.faint, [0, 0, 0, 12]),
    { text: title, font: "Newsreader", fontSize: 30, color: col.ink, lineHeight: 1.05 },
    rule()
  ];
}

const dashList = (items) => ({
  table: {
    widths: [16, "*"],
    body: (items || []).filter(Boolean).map((t) => [
      { text: "–", font: "Inter", fontSize: 10.5, color: col.muted },
      { text: t, font: "Inter", fontSize: 10.5, lineHeight: 1.55, color: col.body }
    ])
  },
  layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 3, paddingBottom: () => 5 }
});

/** Numbered rows with hairlines between, like the policies' contents page. */
const lineRows = (rows) => ({
  table: { widths: [70, "*"], body: rows, dontBreakRows: true },
  layout: {
    hLineWidth: () => 0.6, vLineWidth: () => 0, hLineColor: () => col.hairline,
    paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 9, paddingBottom: () => 9
  }
});

function cover(participantName, reportPeriod, issued) {
  return [
    eyebrow("Knightingale", col.ink, [0, 0, 0, 0]),
    { text: "", margin: [0, 330, 0, 0] },
    eyebrow("Supports Summary", col.faint, [0, 0, 0, 14]),
    { text: participantName || "Participant", font: "Newsreader", fontSize: 40, color: col.ink, lineHeight: 1.05, margin: [0, 0, 0, 18] },
    reportPeriod ? { text: reportPeriod, font: "Newsreader", italics: true, fontSize: 15, color: col.muted, lineHeight: 1.4 } : ""
  ];
}

function contents(sections) {
  return [
    eyebrow("Contents", col.faint, [0, 0, 0, 12]),
    { text: "In this summary", font: "Newsreader", fontSize: 30, color: col.ink },
    rule(col.rule, 0.8, [0, 18, 0, 0]),
    lineRows(sections.map((s, i) => [
      { text: String(i + 1).padStart(2, "0"), font: "Newsreader", fontSize: 11, color: col.muted },
      { text: s, font: "Inter", fontSize: 10, color: col.ink }
    ]))
  ];
}

function sessionLog(sessions) {
  return lineRows((sessions || []).map((s) => [
    { text: s.date || "", font: "Newsreader", fontSize: 11, color: col.muted, lineHeight: 1.3 },
    { text: s.summary || "", font: "Inter", fontSize: 10, lineHeight: 1.55, color: col.body }
  ]));
}

async function buildSupportSummaryPdf({ participantName, reportPeriod, content }) {
  const c = content || {};
  const name = participantName || "Participant";
  const issued = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", month: "long", year: "numeric" }).format(new Date());

  const sections = [];
  const add = (title, blocks) => { if (blocks.length) sections.push({ title, blocks }); };
  const overview = paras(c.overview);
  add("Overview", overview.length ? [lead(overview[0].text), ...overview.slice(1)] : []);
  add("Session Log", (c.sessions || []).length ? [sessionLog(c.sessions)] : []);
  add("Summary of Work", (c.summaryOfWork || []).flatMap((s) => [subhead(s.heading), ...paras(s.body), { text: "", margin: [0, 0, 0, 8] }]));
  add("Observations and Recommendations", [
    ...((c.keyObservations || []).length ? [subhead("Key observations"), dashList(c.keyObservations), { text: "", margin: [0, 0, 0, 14] }] : []),
    ...((c.recommendations || []).length ? [subhead("Recommendations"), dashList(c.recommendations)] : [])
  ]);

  const body = [
    ...cover(name, reportPeriod, issued),
    { text: "", pageBreak: "after" },
    ...contents(sections.map((s) => s.title)),
    ...sections.flatMap((s, i) => [{ text: "", pageBreak: "before" }, ...sectionHead(i + 1, s.title), ...s.blocks])
  ];

  const docDefinition = {
    pageSize: { width: PAGE_W, height: PAGE_H },
    pageMargins: [MX, 70, MX, 80],
    info: { title: `${name} Supports Summary`, author: "Knightingale" },
    defaultStyle: { font: "Inter", color: col.body },
    content: body,
    background: (page) => ({ canvas: [{ type: "rect", x: 0, y: 0, w: PAGE_W, h: PAGE_H, color: page === 1 ? col.cover : col.paper }] }),
    footer: (page) => page === 1
      ? {
          margin: [MX, 0, MX, 0],
          stack: [
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 0.8, lineColor: col.rule }], margin: [0, 0, 0, 10] },
            {
              columns: [
                { stack: [eyebrow("Knightingale", col.ink, [0, 0, 0, 3]), eyebrow(ADDRESS, col.ink, 0)], width: "*" },
                { ...eyebrow(issued, col.ink, 0), alignment: "right", width: 120 }
              ]
            }
          ]
        }
      : {
          margin: [MX, 10, MX, 0],
          stack: [
            { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 0.5, lineColor: col.hairline }], margin: [0, 0, 0, 9] },
            {
              columns: [
                { ...eyebrow(`Knightingale  ·  Supports Summary  ·  ${name}`, col.faint, 0), width: "*" },
                { ...eyebrow(String(page - 1).padStart(2, "0"), col.faint, 0), alignment: "right", width: 40 }
              ]
            }
          ]
        }
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
