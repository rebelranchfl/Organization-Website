"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, SUPABASE_URL } from "../../lib/supabase-client";
import { loadWealthManagementIdentity, type WealthManagementIdentity } from "../../lib/wealth-management-identity";
import styles from "./trusts.module.css";

// Not ready for public discovery yet — kept unlinked from the rest of the
// site, and this stops search engines from indexing or crawling links from
// this page even if they find the URL some other way. Metadata export only
// works from a Server Component in the App Router; since this whole page is
// a Client Component (it needs browser APIs for the Supabase session), the
// same effect is set directly via a meta tag below instead.
function NoIndexTag() {
  return (
    <meta name="robots" content="noindex, nofollow" />
  );
}

type AlterHolder = "self" | "other";
type AlterConstraint = "none" | "hems" | "limited";

type FactsState = {
  roleTrustee: boolean;
  roleBeneficiary: boolean;
  powerRevoke: boolean;
  powerAlter: boolean;
  alterHolder: AlterHolder;
  alterConstraint: AlterConstraint;
};

type FindingKind = "included" | "excluded" | "exposed" | "protected" | "disregarded";

type Finding = {
  num: number;
  title: string;
  kind: FindingKind;
  reasonHtml: string;
  citeLabel: string;
  citeText: string;
  citeId: string | null;
};

type CitationRow = {
  id: string;
  last_checked_at: string | null;
  changed_flag: boolean | null;
};

const CITATION_IDS = [
  "irc-676",
  "irc-677",
  "irc-674",
  "irc-2036",
  "irc-2038",
  "cfr-20.2041-1",
  "irc-2041",
  "fl-736.0103",
  "fl-736.0505",
];

const STATUS_LABEL: Record<FindingKind, string> = {
  included: "Included in estate",
  excluded: "Excluded from estate",
  exposed: "Fully exposed",
  protected: "Not self-settled exposed",
  disregarded: "Disregarded / taxed to you",
};

const FLAG_KINDS: FindingKind[] = ["included", "exposed"];

function computeFindings(s: FactsState): Finding[] {
  const out: Finding[] = [];

  if (s.powerRevoke) {
    out.push({
      num: 1,
      title: "Federal income tax treatment",
      kind: "disregarded",
      reasonHtml:
        "You retain the power to revoke. That alone makes this a <em>grantor trust</em> — disregarded, taxed to you personally.",
      citeLabel: "Authority:",
      citeText: "IRC §676 · Treas. Reg. §1.671-4(b)(2)(i)(A)",
      citeId: "irc-676",
    });
  } else if (s.roleBeneficiary) {
    out.push({
      num: 1,
      title: "Federal income tax treatment",
      kind: "disregarded",
      reasonHtml: "Retained current beneficial enjoyment independently triggers grantor trust status for income tax purposes.",
      citeLabel: "Authority:",
      citeText: "IRC §677(a)",
      citeId: "irc-677",
    });
  } else if (s.powerAlter && s.alterHolder === "self" && s.alterConstraint === "none") {
    out.push({
      num: 1,
      title: "Federal income tax treatment",
      kind: "disregarded",
      reasonHtml: "An unconstrained personal power to redirect beneficial enjoyment generally triggers grantor trust status.",
      citeLabel: "Authority:",
      citeText: "IRC §674(a)",
      citeId: "irc-674",
    });
  } else {
    out.push({
      num: 1,
      title: "Federal income tax treatment",
      kind: "excluded",
      reasonHtml:
        "No revoke power, no retained beneficial interest, no unconstrained personal alter power. Reads as a genuine <em>non-grantor trust</em>.",
      citeLabel: "Authority:",
      citeText: "IRC §§671–678 (by omission)",
      citeId: null,
    });
  }

  if (s.powerRevoke) {
    out.push({
      num: 2,
      title: "Federal estate tax inclusion",
      kind: "included",
      reasonHtml: "A retained power to revoke pulls the full value back into your taxable estate at death.",
      citeLabel: "Authority:",
      citeText: "IRC §2038(a)(1)",
      citeId: "irc-2038",
    });
  } else if (s.roleBeneficiary) {
    out.push({
      num: 2,
      title: "Federal estate tax inclusion",
      kind: "included",
      reasonHtml: "Retained enjoyment of transferred property is its own independent estate-inclusion trigger.",
      citeLabel: "Authority:",
      citeText: "IRC §2036(a)(1)",
      citeId: "irc-2036",
    });
  } else if (s.powerAlter && s.alterHolder === "self" && s.alterConstraint === "none") {
    out.push({
      num: 2,
      title: "Federal estate tax inclusion",
      kind: "included",
      reasonHtml:
        '§2038 treats "alter, amend, revoke, or terminate" identically — an unconstrained personal alter power causes full inclusion.',
      citeLabel: "Authority:",
      citeText: "IRC §2038(a)(1)",
      citeId: "irc-2038",
    });
  } else if (s.powerAlter && s.alterHolder === "self" && s.alterConstraint === "hems") {
    out.push({
      num: 2,
      title: "Federal estate tax inclusion",
      kind: "excluded",
      reasonHtml: "Bound to an ascertainable standard — a recognized safe harbor against §2038 inclusion.",
      citeLabel: "Authority:",
      citeText: "Treas. Reg. §20.2041-1(c)(2)",
      citeId: "cfr-20.2041-1",
    });
  } else if (s.powerAlter && s.alterHolder === "self" && s.alterConstraint === "limited") {
    out.push({
      num: 2,
      title: "Federal estate tax inclusion",
      kind: "excluded",
      reasonHtml:
        "A limited power of appointment — cannot benefit you, your estate, or your creditors — does not cause inclusion.",
      citeLabel: "Authority:",
      citeText: "IRC §2041(b)(1)",
      citeId: "irc-2041",
    });
  } else if (s.powerAlter && s.alterHolder === "other") {
    out.push({
      num: 2,
      title: "Federal estate tax inclusion",
      kind: "excluded",
      reasonHtml:
        "§2038 only reaches a power held by the transferor. Held solely by someone else, it does not pull the trust into your estate.",
      citeLabel: "Authority:",
      citeText: "IRC §2038(a)(1)",
      citeId: "irc-2038",
    });
  } else {
    out.push({
      num: 2,
      title: "Federal estate tax inclusion",
      kind: "excluded",
      reasonHtml:
        "No revocation, no retained enjoyment, no personally-held unconstrained alter power. A completed gift, genuinely outside your estate.",
      citeLabel: "Authority:",
      citeText: "IRC §§2036, 2038 (by omission)",
      citeId: null,
    });
  }

  if (s.powerRevoke) {
    out.push({
      num: 3,
      title: "Florida statutory classification",
      kind: "exposed",
      reasonHtml:
        'Florida defines "revocable" solely by reference to the power to revoke. You hold that power — classified <em>revocable</em>.',
      citeLabel: "Authority:",
      citeText: "Fla. Stat. §736.0103",
      citeId: "fl-736.0103",
    });
  } else {
    out.push({
      num: 3,
      title: "Florida statutory classification",
      kind: "protected",
      reasonHtml: "No power to revoke — even with a retained alter power, Florida classifies this as <em>irrevocable</em>.",
      citeLabel: "Authority:",
      citeText: "Fla. Stat. §736.0103",
      citeId: "fl-736.0103",
    });
  }

  if (s.powerRevoke) {
    out.push({
      num: 4,
      title: "Florida creditor exposure",
      kind: "exposed",
      reasonHtml: "Because the trust is revocable, Florida lets your creditors reach all trust assets — regardless of named beneficiary.",
      citeLabel: "Authority:",
      citeText: "Fla. Stat. §736.0505(1)(a)",
      citeId: "fl-736.0505",
    });
  } else if (s.roleBeneficiary) {
    out.push({
      num: 4,
      title: "Florida creditor exposure",
      kind: "exposed",
      reasonHtml:
        "Irrevocable, but you're also a beneficiary — Florida's self-settled trust rule lets a creditor reach the maximum distributable amount to you.",
      citeLabel: "Authority:",
      citeText: "Fla. Stat. §736.0505(1)(b)",
      citeId: "fl-736.0505",
    });
  } else {
    out.push({
      num: 4,
      title: "Florida creditor exposure",
      kind: "protected",
      reasonHtml: "Irrevocable and you are not a beneficiary — the self-settled rule does not apply on these facts.",
      citeLabel: "Authority:",
      citeText: "Fla. Stat. §736.0505 (inapplicable, by its own terms)",
      citeId: "fl-736.0505",
    });
  }

  return out;
}

export default function TrustsPage() {
  const [identity, setIdentity] = useState<WealthManagementIdentity | null | "loading">("loading");
  const [identityError, setIdentityError] = useState<string | null>(null);

  const [facts, setFacts] = useState<FactsState>({
    roleTrustee: true,
    roleBeneficiary: true,
    powerRevoke: true,
    powerAlter: false,
    alterHolder: "self",
    alterConstraint: "none",
  });

  const [citationsById, setCitationsById] = useState<Record<string, CitationRow>>({});
  const [verifying, setVerifying] = useState(false);
  const [verifySummary, setVerifySummary] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadWealthManagementIdentity()
      .then((id) => {
        if (!cancelled) setIdentity(id);
      })
      .catch((err) => {
        if (!cancelled) {
          setIdentity(null);
          setIdentityError(err?.message ?? "Could not check access.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canView = identity !== "loading" && identity !== null && identity.hasTrustsAccess;

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    supabase
      .from("citations")
      .select("id,last_checked_at,changed_flag")
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const byId: Record<string, CitationRow> = {};
        for (const row of data as CitationRow[]) byId[row.id] = row;
        setCitationsById(byId);
      });
    return () => {
      cancelled = true;
    };
  }, [canView]);

  const findings = useMemo(() => computeFindings(facts), [facts]);

  async function verifyAll() {
    setVerifying(true);
    let done = 0;
    let changed = 0;
    setVerifySummary(`Verifying 0 / ${CITATION_IDS.length}...`);
    for (const id of CITATION_IDS) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-citation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citation_id: id }),
        });
        const json = await res.json();
        if (json?.changed) changed++;
      } catch {
        // one failed check shouldn't stop the rest
      }
      done++;
      setVerifySummary(`Verifying ${done} / ${CITATION_IDS.length}...`);
    }
    const { data } = await supabase.from("citations").select("id,last_checked_at,changed_flag");
    if (data) {
      const byId: Record<string, CitationRow> = {};
      for (const row of data as CitationRow[]) byId[row.id] = row;
      setCitationsById(byId);
    }
    setVerifySummary(`Checked ${done} source${done === 1 ? "" : "s"}${changed ? ` — ${changed} changed` : " — all unchanged"}`);
    setVerifying(false);
  }

  if (identity === "loading") {
    return (
      <>
        <NoIndexTag />
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Wealth Management</p>
          <p>Checking access…</p>
        </div>
      </>
    );
  }

  if (!canView) {
    return (
      <>
        <NoIndexTag />
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Wealth Management</p>
          <div className={styles.locked}>
            <h2>Trusts is part of Wealth Management</h2>
            <p>
              {identity === null
                ? "Sign in, and if you have Trusts or full Wealth Management access, this page will unlock automatically."
                : "Your account doesn't currently have Trusts access."}
            </p>
            {identityError && <p>{identityError}</p>}
            <a className="button button-gold" href="/wealth-management">
              See Wealth Management options
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={styles.shell}>
      <NoIndexTag />
      <p className={styles.eyebrow}>Wealth Management · Money, Finance &amp; Taxes</p>
      <h1 className={styles.title}>Trusts</h1>
      <p className={styles.lede}>
        Describe a trust&rsquo;s roles and retained powers, and see — side by side — how federal income tax, federal estate
        tax, and Florida trust law each treat that exact structure, with the reasoning and the citation behind every
        answer.
      </p>

      <div className={styles.note}>
        <strong>How to use this.</strong> Click &ldquo;Verify sources now&rdquo; to have this page re-check each cited
        statute or regulation against its real, current text. This is a study and cross-reference aid, not a
        substitute for review by a licensed Florida attorney or CPA before acting on any of it.
      </div>

      <div className={styles.layout}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Facts Profile</h2>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Trustee</span>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={facts.roleTrustee}
                onChange={(e) => setFacts((f) => ({ ...f, roleTrustee: e.target.checked }))}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Beneficiary (current)</span>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={facts.roleBeneficiary}
                onChange={(e) => setFacts((f) => ({ ...f, roleBeneficiary: e.target.checked }))}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Power to revoke entirely</span>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={facts.powerRevoke}
                onChange={(e) => setFacts((f) => ({ ...f, powerRevoke: e.target.checked }))}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Power to alter / amend</span>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={facts.powerAlter}
                onChange={(e) => setFacts((f) => ({ ...f, powerAlter: e.target.checked }))}
              />
            </div>

            {facts.powerAlter && (
              <div className={styles.subCondition}>
                <p className={styles.fieldLabel} style={{ marginBottom: 6 }}>
                  Who holds it?
                </p>
                <div className={styles.radioGroup} style={{ marginBottom: 12 }}>
                  <label className={styles.radioOpt}>
                    <input
                      type="radio"
                      name="alterHolder"
                      checked={facts.alterHolder === "self"}
                      onChange={() => setFacts((f) => ({ ...f, alterHolder: "self" }))}
                    />
                    You, personally
                  </label>
                  <label className={styles.radioOpt}>
                    <input
                      type="radio"
                      name="alterHolder"
                      checked={facts.alterHolder === "other"}
                      onChange={() => setFacts((f) => ({ ...f, alterHolder: "other" }))}
                    />
                    Someone else
                  </label>
                </div>

                {facts.alterHolder === "self" && (
                  <>
                    <p className={styles.fieldLabel} style={{ marginBottom: 6 }}>
                      Is it constrained?
                    </p>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioOpt}>
                        <input
                          type="radio"
                          name="alterConstraint"
                          checked={facts.alterConstraint === "none"}
                          onChange={() => setFacts((f) => ({ ...f, alterConstraint: "none" }))}
                        />
                        No — open discretion
                      </label>
                      <label className={styles.radioOpt}>
                        <input
                          type="radio"
                          name="alterConstraint"
                          checked={facts.alterConstraint === "hems"}
                          onChange={() => setFacts((f) => ({ ...f, alterConstraint: "hems" }))}
                        />
                        Yes — ascertainable standard (HEMS)
                      </label>
                      <label className={styles.radioOpt}>
                        <input
                          type="radio"
                          name="alterConstraint"
                          checked={facts.alterConstraint === "limited"}
                          onChange={() => setFacts((f) => ({ ...f, alterConstraint: "limited" }))}
                        />
                        Yes — limited power of appointment
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <button type="button" className="button button-gold" onClick={verifyAll} disabled={verifying}>
                {verifying ? "Verifying…" : "Verify sources now"}
              </button>
              {verifySummary && (
                <p style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }}>{verifySummary}</p>
              )}
            </div>
          </div>
        </section>

        <section className={styles.determinations}>
          {findings.map((f) => {
            const flagged = FLAG_KINDS.includes(f.kind);
            const rec = f.citeId ? citationsById[f.citeId] : undefined;
            return (
              <article key={f.num} className={`${styles.finding} ${flagged ? styles.findingFlag : ""}`}>
                <div className={styles.findingTop}>
                  <div>
                    <div className={styles.findingNum}>Item {f.num}</div>
                    <h3 className={styles.findingTitle}>{f.title}</h3>
                  </div>
                  <span className={styles.statusTag}>{STATUS_LABEL[f.kind]}</span>
                </div>
                <p className={styles.findingReason} dangerouslySetInnerHTML={{ __html: f.reasonHtml }} />
                <div className={styles.citeRow}>
                  <span className={styles.citeLabel}>{f.citeLabel}</span>
                  <span className={styles.citeText}>{f.citeText}</span>
                </div>
                {rec?.last_checked_at && (
                  <p className={styles.verifyStatus}>
                    {rec.changed_flag ? "Source text changed since prior check — reverify" : "Verified live"}{" "}
                    {new Date(rec.last_checked_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
