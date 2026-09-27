"use client";

// Learner area shell (v1): sidebar + phone top bar + RRM parent footer.
// Structure follows the approved "RRA UI Direction 1 Learning Hub" concept.
// Only screens that exist are linked (v1 = Library). Dashboard, Account and
// My Materials are added when their screens are built — no empty pages.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./learn.module.css";
import { CloseIcon, HomeIcon, LibraryIcon, MenuIcon } from "./icons";

const RRM = "https://rebelranchministries.org";
const LOGO = `${RRM}/assets/rebel_ranch_academy_logo_transparent-cropped.png`; // same approved file the Academy home page uses
const nav = [{ href: "/learn/library", label: "Library", Icon: LibraryIcon }];

export default function LearnShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/learn/library" aria-label="Rebel Ranch Academy Library">
          <img src={LOGO} alt="" width={40} height={40} />
          <span><strong>Rebel Ranch</strong><small>Academy</small></span>
        </a>
        <button className={styles.menuBtn} type="button" aria-expanded={open} aria-controls="learn-nav" onClick={() => setOpen(!open)}>
          {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}<span className={styles.srOnly}>{open ? "Close menu" : "Open menu"}</span>
        </button>
      </header>

      <aside id="learn-nav" className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <a className={`${styles.brand} ${styles.sideBrand}`} href="/learn/library" aria-label="Rebel Ranch Academy Library">
          <img src={LOGO} alt="" width={56} height={56} />
          <span><strong>Rebel Ranch</strong><small>Academy</small></span>
        </a>
        <nav className={styles.nav} aria-label="Learner area">
          {nav.map(({ href, label, Icon }) => (
            <a key={href} href={href} className={pathname.startsWith(href) ? styles.navActive : undefined} aria-current={pathname.startsWith(href) ? "page" : undefined} onClick={() => setOpen(false)}>
              <Icon size={20} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className={styles.sideFoot}>
          <Link href="/"><HomeIcon size={18} /><span>Academy home</span></Link>
          <a href={RRM}>Rebel Ranch Ministries</a>
        </div>
      </aside>

      <div className={styles.main}>
        <main className={styles.content}>{children}</main>
        <footer className={styles.footer}>
          <div className={styles.footAcademy}>
            <img src={LOGO} alt="" width={44} height={44} />
            <div><strong>Rebel Ranch Academy</strong><span>A program of Rebel Ranch Ministries</span></div>
          </div>
          <div className={styles.footParent}>
            <a className={styles.footRrm} href={RRM}>
              <img src={`${RRM}/assets/brand/Rebel%20Ranch%20Ministries/rrm-logo-white.png`} alt="Rebel Ranch Ministries" height={36} />
            </a>
            <nav aria-label="Rebel Ranch Ministries">
              <a href={`${RRM}/contact.html`}>Contact</a>
              <a href={`${RRM}/privacy-policy.html`}>Privacy Policy</a>
              <a href={`${RRM}/legal-disclosures.html`}>Legal Disclosures</a>
              <a href="https://www.facebook.com/rebelranchministries" rel="noopener">Facebook</a>
              <a href="https://www.instagram.com/rebel_ranch_fl" rel="noopener">Instagram</a>
              <a href="https://www.youtube.com/@RebelRanchMinistries" rel="noopener">YouTube</a>
            </nav>
            <p>© 2026 Faith, Family &amp; Nature Church, Inc.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
