// Knightingale's branded email layout (the same look as the progress note, birthday and roster emails).

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SANS = "Arial,Helvetica,sans-serif";
const SERIF = "Didot,'Didot LT STD','Hoefler Text',Garamond,Georgia,'Times New Roman',serif";
const rule = (color: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" style="height:1px;line-height:1px;font-size:0;background-color:${color}">&nbsp;</td></tr></table>`;
const pad = (top: number, inner: string, bottom = 0) => `<tr><td style="padding:${top}px 48px ${bottom}px 48px">${inner}</td></tr>`;

export type BrandedEmail = {
  /** Small capitals top right, e.g. "Compliance". */
  kind: string;
  /** Hidden inbox preview line. */
  preview: string;
  /** Label / value rows. */
  rows: [string, string][];
  /** Optional section with a heading and paragraph text (newlines kept). */
  section?: { heading: string; text: string };
  /** Buttons, e.g. View document. */
  buttons?: { label: string; href: string }[];
};

export function brandedHtml(e: BrandedEmail) {
  const rows = e.rows.map(([k, v], i) => {
    const pb = i < e.rows.length - 1 ? "padding-bottom:14px;" : "";
    return `<tr><td valign="top" style="${pb}font-family:${SANS};font-size:14px;line-height:18px;color:#8a8778;letter-spacing:2.5px;text-transform:uppercase;width:170px">${esc(k)}</td><td valign="top" style="${pb}font-family:${SANS};font-size:18px;line-height:22px;color:#1c1c1c">${esc(v)}</td></tr>`;
  }).join("");
  const section = e.section
    ? pad(30, rule("#e3e1db")) +
      pad(26, `<div style="font-family:${SANS};font-size:15px;line-height:14px;color:#8a8778;letter-spacing:2.5px;text-transform:uppercase">${esc(e.section.heading)}</div>`) +
      pad(16, `<div style="font-family:${SANS};font-size:18px;line-height:30px;color:#4a4a45">${esc(e.section.text).replace(/\n/g, "<br>")}</div>`)
    : "";
  const buttons = e.buttons?.length
    ? pad(30, e.buttons.map((b) =>
        `<a href="${esc(b.href)}" style="display:inline-block;margin:0 10px 10px 0;padding:14px 26px;background-color:#0f1b3d;color:#ffffff;font-family:${SANS};font-size:13px;letter-spacing:2px;text-transform:uppercase;text-decoration:none">${esc(b.label)}</a>`).join(""))
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light dark"></head>
<body style="margin:0;padding:0;background-color:#f2f1ed">
<span style="display:none;font-size:1px;color:#f2f1ed;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${esc(e.preview)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f2f1ed"><tr><td align="center" style="padding:40px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #e3e1db">
${pad(44, `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="left" style="font-family:${SERIF};font-size:36px;line-height:36px;color:#0f1b3d;letter-spacing:-0.4px"><a href="https://knightingale.com.au" style="color:#0f1b3d;text-decoration:none">knightingale</a></td><td align="right" style="font-family:${SANS};font-size:10px;line-height:14px;color:#8a8778;letter-spacing:3px;text-transform:uppercase;padding-top:12px">${esc(e.kind)}</td></tr></table>`)}
${pad(26, rule("#0f1b3d"))}
${pad(30, `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`)}
${section}
${buttons}
${pad(34, `${rule("#0f1b3d")}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding-top:22px;font-family:${SERIF};font-size:14px;line-height:18px;color:#0f1b3d;letter-spacing:4px;text-transform:uppercase">Making the world kinder</td></tr><tr><td align="center" style="padding-top:16px;font-family:${SANS};font-size:14px;line-height:22px;color:#6b6b64"><a href="https://knightingale.com.au" style="color:#6b6b64;text-decoration:none">knightingale.com.au</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="mailto:care@knightingale.com.au" style="color:#6b6b64;text-decoration:none">care@knightingale.com.au</a>&nbsp;&nbsp;·&nbsp;&nbsp;+61 426 512 584</td></tr><tr><td align="center" style="padding-top:10px;font-family:${SANS};font-size:11px;line-height:18px;color:#9a978c">Melbourne VIC 3006</td></tr></table>`, 40)}
</table></td></tr></table></body></html>`;
}
