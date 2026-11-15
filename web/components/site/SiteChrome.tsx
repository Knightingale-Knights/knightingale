import Link from "next/link";

const NAV = [
  ["/about_us", "About"],
  ["/care_organisations", "Care Organisations"],
  ["/healthcare_professionals", "Healthcare Professionals"],
  ["/ndis", "NDIS Supports"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-head">
      <div className="s-wrap">
        <Link href="/" className="site-logo">knightingale</Link>
        <input type="checkbox" id="site-menu" className="site-menu-toggle" aria-label="Menu" />
        <label htmlFor="site-menu" className="site-burger" aria-hidden="true"><span /><span /><span /></label>
        <nav className="site-nav">
          {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/login" className="quiet">Login</Link>
          <Link href="/join" className="s-btn small">Join Us</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="s-wrap foot-grid">
        <div>
          <p className="site-logo light">knightingale</p>
          <p>Throw kindness around like confetti.</p>
          <p className="muted">Melbourne, Australia</p>
        </div>
        <div>
          <h4>Seeking nurses or carers?</h4>
          <p><Link href="/care_organisations">Find nurses</Link></p>
          <p><Link href="/ndis">NDIS supports</Link></p>
        </div>
        <div>
          <h4>Compassionate and caring?</h4>
          <p><Link href="/join">Find work</Link></p>
          <p><Link href="/healthcare_professionals">Why join us</Link></p>
        </div>
        <div>
          <h4>Contact</h4>
          <p><a href="mailto:care@knightingale.com.au">care@knightingale.com.au</a></p>
          <p><Link href="/contact_us">Get in touch</Link></p>
        </div>
      </div>
      <div className="s-wrap foot-legal">
        <span>© {new Date().getFullYear()} The Trustee for Nebula Trust, trading as Knightingale · ABN 50 405 424 095</span>
        <span><Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Service</Link></span>
      </div>
    </footer>
  );
}
