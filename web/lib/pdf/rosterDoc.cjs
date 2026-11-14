// Weekly roster PDF and email, copied from the Roster repo (api/send-roster.js) so they look the same.
// Data comes from the app instead of Bubble: participant { name, ndisNumber }, shifts [{ weekday, dayMonth, timeRange, carer, hours }].
const PdfPrinter = require('pdfmake');

// 24hr number (e.g. 1300) -> "1:00 pm", 0 -> "12:00 am", 1230 -> "12:30 pm"
function to12h(n) {
  if (n == null) return '';
  const v = Math.round(n);
  let h = Math.floor(v / 100);
  const m = v % 100;
  const period = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

// "10:00 am to 1:00 pm" — drops the am/pm on the start when it matches the end
function fmtTimeRange(start, end) {
  const s12 = to12h(start);
  const e12 = to12h(end);
  const sPeriod = s12.slice(-2);
  const ePeriod = e12.slice(-2);
  const startText = sPeriod === ePeriod ? s12.slice(0, -3) : s12;
  return `${startText} to ${e12}`;
}

// ─── PDF generation ──────────────────────────────────────────────────────────

const NAVY = '#1e2a4a';
const SLATE = '#6b748a';
const SLATE_LIGHT = '#8a93a6';
const HAIRLINE = '#d8d5cd';
const ROW_LINE = '#e5e2da';
const INK = '#28324d';

function buildPdf(participant, shifts, weekRangeText, stats) {
  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
    Times: {
      normal: 'Times-Roman',
      bold: 'Times-Bold',
      italics: 'Times-Italic',
      bolditalics: 'Times-BoldItalic',
    },
  };

  const printer = new PdfPrinter(fonts);
  const participantName = participant.name;

  const shiftRows = shifts.map((s, i) => {
    const carerName = s.carer || 'TBC';
    const isTbc = carerName === 'TBC';
    const topBorder = i === 0 ? [false, false, false, false] : [false, true, false, false];
    return [
      {
        text: [
          { text: s.weekday + ' ', bold: true, color: INK },
          { text: s.dayMonth, color: SLATE_LIGHT },
        ],
        border: topBorder,
        margin: [0, 15, 0, 15],
      },
      { text: s.timeRange, color: INK, border: topBorder, margin: [0, 15, 0, 15] },
      { text: carerName, color: isTbc ? '#BA7517' : INK, italics: isTbc, border: topBorder, margin: [0, 15, 0, 15] },
      { text: String(s.hours ?? ''), alignment: 'right', color: INK, border: topBorder, margin: [0, 15, 0, 15] },
    ];
  });

  const hr = (space) => ({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 475, y2: 0, lineWidth: 1.2, lineColor: NAVY }],
    margin: [0, space[0], 0, space[1]],
  });

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [60, 56, 60, 56],
    defaultStyle: { font: 'Helvetica', fontSize: 10, color: INK },
    content: [
      // ── Top row: logo + WEEKLY ROSTER ──
      {
        columns: [
          { text: 'Knightingale', font: 'Times', fontSize: 26, color: NAVY, width: '*' },
          { text: 'WEEKLY ROSTER', font: 'Helvetica', fontSize: 9, color: SLATE_LIGHT, bold: true, characterSpacing: 1.5, alignment: 'right', margin: [0, 12, 0, 0] },
        ],
      },
      hr([20, 22]),

      // ── Date range + name + NDIS ──
      { text: weekRangeText.toUpperCase(), fontSize: 9.5, color: SLATE_LIGHT, bold: true, characterSpacing: 1.2, margin: [0, 0, 0, 8] },
      { text: participantName, font: 'Times', fontSize: 34, color: NAVY, margin: [0, 0, 0, 10] },
      { text: `NDIS number ${participant.ndisNumber || ''}`, fontSize: 11, color: SLATE, margin: [0, 0, 0, 0] },

      hr([24, 22]),

      // ── Stats row: three evenly-spread hero figures ──
      {
        columns: [
          {
            width: '*',
            text: [
              { text: stats.totalHoursText, font: 'Times', fontSize: 40, color: NAVY },
              { text: ' hrs', font: 'Times', fontSize: 18, color: SLATE },
            ],
          },
          {
            width: '*',
            alignment: 'center',
            text: [
              { text: String(stats.shiftCount), font: 'Times', fontSize: 40, color: NAVY },
              { text: ` shift${stats.shiftCount === 1 ? '' : 's'}`, font: 'Times', fontSize: 18, color: SLATE },
            ],
          },
          {
            width: '*',
            alignment: 'right',
            text: [
              { text: String(stats.carerCount), font: 'Times', fontSize: 40, color: NAVY },
              { text: ` carer${stats.carerCount === 1 ? '' : 's'}`, font: 'Times', fontSize: 18, color: SLATE },
            ],
          },
        ],
      },

      hr([24, 22]),

      // ── Shift schedule ──
      { text: 'SHIFT SCHEDULE', fontSize: 9.5, color: SLATE_LIGHT, bold: true, characterSpacing: 1.2, margin: [0, 0, 0, 12] },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', 40],
          body: [
            [
              { text: 'DAY', style: 'th' },
              { text: 'TIME', style: 'th' },
              { text: 'CARER', style: 'th' },
              { text: 'HRS', style: 'th', alignment: 'right' },
            ],
            ...shiftRows,
          ],
        },
        layout: {
          hLineWidth: (i) => (i === 0 || i === 1 ? 0 : 0.8),
          vLineWidth: () => 0,
          hLineColor: () => ROW_LINE,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
    ],
    styles: {
      th: { fontSize: 8.5, color: SLATE_LIGHT, bold: true, characterSpacing: 1, margin: [0, 0, 0, 10] },
    },
    footer: {
      margin: [60, 20, 60, 0],
      columns: [
        { text: 'Knightingale, Melbourne VIC', fontSize: 10, color: SLATE_LIGHT, width: '*' },
        { text: 'paul@knightingale.com.au', fontSize: 10, color: NAVY, alignment: 'right' },
      ],
    },
  };

  return new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

// ─── Email HTML ───────────────────────────────────────────────────────────────

function buildEmailHtml(participant, shifts, weekRangeText, stats) {
  const participantName = participant.name;

  const rows = shifts.map((s, i) => {
    const carerName = s.carer || 'TBC';
    const isTbc = carerName === 'TBC';
    const topBorder = i === 0 ? '' : 'border-top:1px solid #e5e2da;';
    return `
      <tr>
        <td style="padding:24px 0;${topBorder}font-size:14px;color:#28324d"><strong>${s.weekday}</strong> <span style="color:#8a93a6">${s.dayMonth}</span></td>
        <td style="padding:24px 0;${topBorder}font-size:14px;color:#28324d">${s.timeRange}</td>
        <td style="padding:24px 0;${topBorder}font-size:14px;${isTbc ? 'color:#BA7517;font-style:italic' : 'color:#28324d'}">${carerName}</td>
        <td style="padding:24px 0;${topBorder}font-size:14px;color:#28324d;text-align:right;font-weight:500">${s.hours ?? ''}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#ebe9e4;color:#1e2a4a">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;max-width:580px;border-radius:10px;overflow:hidden">
  <tr><td style="padding:48px 56px 40px">

    <!-- top row -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#1e2a4a;letter-spacing:0.5px">Knightingale</td>
      <td style="font-size:10px;letter-spacing:0.15em;color:#8a93a6;font-weight:bold;text-align:right;vertical-align:bottom">WEEKLY ROSTER</td>
    </tr></table>

    <div style="border-top:1.5px solid #1e2a4a;margin:20px 0"></div>

    <!-- date range + name + ndis -->
    <div style="font-size:11px;letter-spacing:0.12em;color:#8a93a6;font-weight:bold;text-transform:uppercase;margin-bottom:8px">${weekRangeText}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:36px;color:#1e2a4a;line-height:1.05;margin-bottom:12px">${participantName}</div>
    <div style="font-size:13px;color:#6b748a">NDIS number ${participant.ndisNumber || ''}</div>

    <div style="border-top:1.5px solid #1e2a4a;margin:24px 0"></div>

    <!-- stats row -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:40px;color:#1e2a4a;line-height:1;text-align:left">${stats.totalHoursText}<span style="font-size:18px;color:#6b748a">&nbsp;hrs</span></td>
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:40px;color:#1e2a4a;line-height:1;text-align:center">${stats.shiftCount}<span style="font-size:18px;color:#6b748a">&nbsp;shift${stats.shiftCount === 1 ? '' : 's'}</span></td>
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:40px;color:#1e2a4a;line-height:1;text-align:right">${stats.carerCount}<span style="font-size:18px;color:#6b748a">&nbsp;carer${stats.carerCount === 1 ? '' : 's'}</span></td>
    </tr></table>

    <div style="border-top:1.5px solid #1e2a4a;margin:24px 0"></div>

    <!-- shift schedule -->
    <div style="font-size:11px;letter-spacing:0.12em;color:#8a93a6;font-weight:bold;text-transform:uppercase;margin-bottom:14px">Shift Schedule</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <thead>
        <tr>
          <th style="font-size:10px;letter-spacing:0.1em;color:#8a93a6;font-weight:bold;text-transform:uppercase;text-align:left;padding-bottom:10px">Day</th>
          <th style="font-size:10px;letter-spacing:0.1em;color:#8a93a6;font-weight:bold;text-transform:uppercase;text-align:left;padding-bottom:10px">Time</th>
          <th style="font-size:10px;letter-spacing:0.1em;color:#8a93a6;font-weight:bold;text-transform:uppercase;text-align:left;padding-bottom:10px">Carer</th>
          <th style="font-size:10px;letter-spacing:0.1em;color:#8a93a6;font-weight:bold;text-transform:uppercase;text-align:right;padding-bottom:10px">Hrs</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="border-top:1px solid #d8d5cd;margin:28px 0 20px"></div>

    <!-- footer -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:12px;color:#8a93a6">Knightingale, Melbourne VIC</td>
      <td style="font-size:12px;color:#1e2a4a;text-align:right">paul@knightingale.com.au</td>
    </tr></table>

  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}


module.exports = { buildPdf, buildEmailHtml, fmtTimeRange };
