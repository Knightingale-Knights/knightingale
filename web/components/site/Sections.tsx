import Link from "next/link";
import { Prose, Rich } from "@/lib/site/bbcode";
import type { Cta, Section } from "@/lib/site/types";
import { siteImg } from "@/lib/files";

function Buttons({ cta, light }: { cta: Cta; light?: boolean }) {
  if (!cta?.length) return null;
  return (
    <div className="s-actions">
      {cta.map((c) => <Link key={c.text} href={c.href} className={`s-btn ${light ? "light" : ""}`}>{c.text}</Link>)}
    </div>
  );
}

const Eyebrow = ({ text }: { text: string | null | undefined }) => (text ? <p className="s-eyebrow"><Rich text={text} /></p> : null);
const Title = ({ text, as = "h2" }: { text: string | null | undefined; as?: "h1" | "h2" }) =>
  text ? (as === "h1" ? <h1 className="s-title"><Rich text={text} /></h1> : <h2 className="s-title"><Rich text={text} /></h2>) : null;
const Body = ({ body }: { body: string[] }) => <>{body.map((b, i) => <Prose key={i} text={b} />)}</>;

/** One section of a public page. Designs: hero, text, split (image beside text), cards, steps, logos, statement, we are / we are not, FAQ, call to action. */
export function SiteSection({ s: raw, i }: { s: Section; i: number }) {
  const s = tidy(raw);
  switch (s.kind) {
    case "hero":
      return (
        <section className="s-hero">
          <div className="s-wrap s-grid">
            <div>
              <Eyebrow text={s.eyebrow} />
              <Title text={s.title} as="h1" />
              <div className="s-lead"><Body body={s.body} /></div>
              <Buttons cta={s.cta} />
            </div>
            {s.image && <img src={siteImg(s.image)} alt="" className="s-hero-img" />}
          </div>
        </section>
      );
    case "text":
      return (
        <section className={`s-text ${i % 2 ? "tint" : ""}`}>
          <div className="s-wrap narrow">
            <Eyebrow text={s.eyebrow} />
            <Title text={s.title} />
            <Body body={s.body} />
            <Buttons cta={s.cta} />
          </div>
        </section>
      );
    case "split":
      return (
        <section className="s-split">
          <div className={`s-wrap s-grid ${s.side === "left" ? "flip" : ""}`}>
            <div>
              <Eyebrow text={s.eyebrow} />
              <Title text={s.title} />
              <Body body={s.body} />
              <Buttons cta={s.cta} />
            </div>
            <img src={siteImg(s.image)} alt="" className="s-split-img" />
          </div>
        </section>
      );
    case "cards":
      return (
        <section className={`s-cards ${s.numbered ? "numbered" : ""}`}>
          <div className="s-wrap">
            <Eyebrow text={s.eyebrow} />
            <Title text={s.title} />
            {s.intro.length > 0 && <div className="s-intro"><Body body={s.intro} /></div>}
            <div className={`s-card-grid n${Math.min(s.items.length, 4)}`}>
              {s.items.map((it, n) => (
                <article key={n} className="s-card">
                  {s.numbered ? <span className="s-num">{(it.kicker ?? it.title).replace(".", "")}</span> : it.kicker && <span className="s-kicker"><Rich text={it.kicker} /></span>}
                  {!(s.numbered && /^\d+\.?$/.test(it.title)) && <h3><Rich text={it.title} /></h3>}
                  {it.image && <img src={siteImg(it.image)} alt="" />}
                  <Body body={it.body} />
                </article>
              ))}
            </div>
            <Buttons cta={s.cta} />
          </div>
        </section>
      );
    case "steps":
      return (
        <section className="s-steps">
          <div className="s-wrap">
            <Eyebrow text={s.eyebrow} />
            <Title text={s.title} />
            <ol>{s.steps.map((t, n) => <li key={n}><span>{n + 1}</span><Rich text={t} /></li>)}</ol>
            <Buttons cta={s.cta} />
          </div>
        </section>
      );
    case "logos":
      return (
        <section className="s-logos">
          <div className="s-wrap">
            <p className="s-eyebrow center"><Rich text={s.title} /></p>
            <div className="s-logo-row">{s.images.map((src) => <img key={src} src={siteImg(src)} alt="" />)}</div>
          </div>
        </section>
      );
    case "statement": {
      const stat = s.stat.replace(/\[\/?size[^\]]*\]/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
      return (
        <section className="s-statement">
          <div className="s-wrap s-grid">
            <div>
              <Eyebrow text={s.eyebrow} />
              <Title text={s.title} />
              <Body body={s.body} />
            </div>
            <div className="s-stat">
              <span className="s-stat-value">{stat[0]}</span>
              {stat.slice(1).map((l) => <span key={l} className="s-stat-line">{l}</span>)}
            </div>
          </div>
        </section>
      );
    }
    case "weare":
      return (
        <section className="s-weare">
          <div className="s-wrap">
            <Eyebrow text={s.eyebrow} />
            <div className="s-grid even">
              <div className="s-yes"><Title text={s.title} /><ul>{s.yes.map((y) => <li key={y}><Rich text={y} /></li>)}</ul></div>
              {s.noTitle && <div className="s-no"><Title text={s.noTitle} /><ul>{s.no.map((y) => <li key={y}><Rich text={y} /></li>)}</ul></div>}
            </div>
          </div>
        </section>
      );
    case "faq":
      return (
        <section className="s-faq">
          <div className="s-wrap narrow">
            <Title text={s.title} />
            {s.items.map((f) => (
              <details key={f.q}>
                <summary><Rich text={f.q} /></summary>
                <Prose text={f.a} />
              </details>
            ))}
          </div>
        </section>
      );
    case "cta":
      return (
        <section className="s-cta">
          <div className="s-wrap narrow center">
            <Eyebrow text={s.eyebrow} />
            <Title text={s.title} />
            <Buttons cta={s.cta} light />
          </div>
        </section>
      );
    case "stats":
      return (
        <section className="s-hero">
          <div className="s-wrap s-grid">
            <div>
              <Eyebrow text={s.eyebrow} />
              <Title text={s.title} as="h1" />
              <div className="s-lead"><Body body={s.body} /></div>
              <div className="s-stats">{s.stats.map((x) => <div key={x.label}><strong>{x.value}</strong><span>{x.label}</span></div>)}</div>
              <Buttons cta={s.cta} />
            </div>
            {s.image && <img src={siteImg(s.image)} alt="" className="s-hero-img" />}
          </div>
        </section>
      );
    case "pricing":
      return (
        <section className="s-pricing">
          <div className="s-wrap narrow">
            <Eyebrow text={s.eyebrow} />
            <Title text={s.title} />
            <Body body={s.intro} />
            <table>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.price} className={r.ours ? "ours" : ""}>
                    <td>{r.logo ? <img src={siteImg(r.logo)} alt={r.label} /> : r.label}</td>
                    <td className="price">{r.price}</td>
                    <td className="note">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {s.footnote && <p className="s-footnote"><Rich text={s.footnote} /></p>}
          </div>
        </section>
      );
    case "contact":
      return (
        <section className="s-split">
          <div className="s-wrap s-grid">
            <div>
              <Title text={s.title} as="h1" />
              <Body body={s.body} />
              <dl className="s-contact">
                {s.lines.map((l) => (
                  <div key={l.label}><dt>{l.label}</dt><dd>{l.href ? <a href={l.href}>{l.value}</a> : <Rich text={l.value} />}</dd></div>
                ))}
              </dl>
            </div>
            {s.image && <img src={siteImg(s.image)} alt="" className="s-split-img" />}
          </div>
        </section>
      );
    case "legal":
      return (
        <section className="s-legal">
          <div className="s-wrap narrow">
            <h1 className="s-title">{s.title}</h1>
            <Prose text={s.text} />
          </div>
        </section>
      );
  }
}

/** Some Bubble headings hold a sentence and a paragraph; keep the first line as the heading and move the rest into the text. */
function tidy(s: Section): Section {
  if ((s.kind === "text" || s.kind === "split") && s.title && s.title.length > 110 && s.title.includes("\n")) {
    const [first, ...rest] = s.title.split("\n");
    return { ...s, title: first, body: [`[b]${rest.join(" ").trim()}[/b]`, ...s.body] };
  }
  return s;
}
