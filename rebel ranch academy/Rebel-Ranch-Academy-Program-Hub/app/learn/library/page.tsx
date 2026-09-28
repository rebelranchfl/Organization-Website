"use client";

// Learner Library (v1). Shows:
//  1) learning-area filter tiles (the six areas the Academy already presents);
//  2) released Academy materials from get_academy_catalog() — this section is
//     hidden while nothing has been released, so there is no empty shelf;
//  3) the seven free sample activities the home page already offers.
// Image spots are marked with data-image-slot for ChatGPT image production.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { useEffect, useMemo, useState } from "react";
import styles from "../learn.module.css";
import { AllIcon, AreaIcon, ArrowIcon, CheckIcon, CloseIcon } from "../icons";
import { experiences, learningAreas, type Experience } from "../../lib/academy-content";
import { supabase } from "../../lib/supabase-client";

type CatalogItem = {
  project_id: string; title: string; summary: string | null; item_type: string;
  learning_area_id: string | null; price_usd: number | null; cover_image_url: string | null;
  lesson_url: string | null; released_at: string | null;
};

const areaIdByTitle = Object.fromEntries(learningAreas.map((a) => [a.title, a.id]));
const typeLabel: Record<string, string> = { LESSON: "Lesson", GUIDE: "Guide", WORKSHEET: "Worksheet", TOOL: "Tool", VIDEO: "Video", BUNDLE: "Bundle" };

function readPlan(): string[] {
  try { const v = JSON.parse(localStorage.getItem("rra-plan") || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function price(p: number | null) { if (p === null || p === undefined) return null; return Number(p) === 0 ? "Free" : `$${Number(p).toFixed(Number(p) % 1 ? 2 : 0)}`; }

export default function LibraryPage() {
  const [area, setArea] = useState<string>("all");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [plan, setPlan] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setPlan(readPlan()), 0);
    let live = true;
    supabase.rpc("get_academy_catalog").then(({ data, error }) => {
      if (live && !error && Array.isArray(data)) setCatalog(data as CatalogItem[]);
    });
    return () => { live = false; window.clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  const activities = useMemo(() => experiences.filter((x) => area === "all" || areaIdByTitle[x.area] === area), [area]);
  const released = useMemo(() => catalog.filter((x) => area === "all" || x.learning_area_id === area), [catalog, area]);
  const current = openId ? experiences.find((x) => x.id === openId) || null : null;
  const areaName = area === "all" ? null : learningAreas.find((a) => a.id === area)?.title;

  const togglePlan = (id: string) => {
    const next = plan.includes(id) ? plan.filter((x) => x !== id) : [...plan, id];
    setPlan(next);
    try { localStorage.setItem("rra-plan", JSON.stringify(next)); } catch {}
  };

  return (
    <div className={styles.library}>
      <section className={styles.hero} data-image-slot="library-hero" aria-labelledby="lib-title">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Library</p>
          <h1 id="lib-title">Real skills for real life.</h1>
          <p>Everything you can learn at Rebel Ranch Academy, in one place. Start with a free activity — no account needed.</p>
        </div>
      </section>

      <section aria-labelledby="areas-title" className={styles.section}>
        <h2 id="areas-title" className={styles.h2}>Learning areas</h2>
        <div className={styles.areaGrid} role="group" aria-label="Filter by learning area">
          <button type="button" className={`${styles.areaTile} ${area === "all" ? styles.areaOn : ""}`} aria-pressed={area === "all"} onClick={() => setArea("all")}>
            <AllIcon size={26} /><span>All areas</span>
          </button>
          {learningAreas.map((a) => (
            <button key={a.id} type="button" className={`${styles.areaTile} ${area === a.id ? styles.areaOn : ""}`} aria-pressed={area === a.id} onClick={() => setArea(a.id)}>
              <AreaIcon id={a.id} size={26} /><span>{a.short}</span>
            </button>
          ))}
        </div>
        {areaName && <p className={styles.areaNote}>{learningAreas.find((a) => a.id === area)?.description}</p>}
      </section>

      {released.length > 0 && (
        <section aria-labelledby="mat-title" className={styles.section}>
          <h2 id="mat-title" className={styles.h2}>Academy materials</h2>
          <div className={styles.cardGrid}>
            {released.map((m) => (
              <article key={m.project_id} className={styles.card}>
                <div className={styles.cardImg} data-image-slot={`material-${m.project_id}`}>
                  {m.cover_image_url ? <img src={m.cover_image_url} alt="" /> : <AreaIcon id={m.learning_area_id || ""} size={40} />}
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardMeta}>{typeLabel[m.item_type] || "Lesson"}{m.learning_area_id ? ` · ${learningAreas.find((a) => a.id === m.learning_area_id)?.short ?? ""}` : ""}</p>
                  <h3>{m.title}</h3>
                  {m.summary && <p>{m.summary}</p>}
                  <div className={styles.cardFoot}>
                    {price(m.price_usd) && <span className={styles.label}>{price(m.price_usd)}</span>}
                    {m.lesson_url && <a className={styles.btn} href={m.lesson_url}>Open<ArrowIcon size={16} /></a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="free-title" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id="free-title" className={styles.h2}>Free activities</h2>
          <p>{activities.length} {activities.length === 1 ? "activity" : "activities"}{areaName ? ` in ${areaName}` : ""}</p>
        </div>
        {activities.length === 0 ? (
          <p className={styles.empty}>No free activity in this area yet. <button type="button" className={styles.linkBtn} onClick={() => setArea("all")}>See all areas</button></p>
        ) : (
          <div className={styles.cardGrid}>
            {activities.map((x) => <ActivityCard key={x.id} x={x} saved={plan.includes(x.id)} onOpen={() => setOpenId(x.id)} />)}
          </div>
        )}
      </section>

      {current && (
        <div className={styles.overlay} onClick={() => setOpenId(null)}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="act-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeBtn} onClick={() => setOpenId(null)} aria-label="Close" autoFocus><CloseIcon size={20} /></button>
            <p className={styles.cardMeta}>{current.area} · {current.ages} · {current.time}</p>
            <h2 id="act-title">{current.title}</h2>
            <p>{current.description}</p>
            <h3>What you will learn</h3>
            <ul className={styles.checks}>{current.learn.map((l) => <li key={l}><CheckIcon size={18} />{l}</li>)}</ul>
            <h3>Your challenge</h3>
            <p>{current.challenge}</p>
            <div className={styles.dialogFoot}>
              <button type="button" className={styles.btn} onClick={() => togglePlan(current.id)} aria-pressed={plan.includes(current.id)}>
                {plan.includes(current.id) ? <><CheckIcon size={16} />Saved to my plan</> : "Save to my plan"}
              </button>
              <span className={styles.hint}>Your plan is saved on this device.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ x, saved, onOpen }: { x: Experience; saved: boolean; onOpen: () => void }) {
  const id = areaIdByTitle[x.area] || "";
  return (
    <article className={styles.card}>
      <div className={styles.cardImg} data-image-slot={`activity-${x.id}`}><AreaIcon id={id} size={40} /></div>
      <div className={styles.cardBody}>
        <p className={styles.cardMeta}>{learningAreas.find((a) => a.id === id)?.short} · {x.ages} · {x.time}</p>
        <h3>{x.title}</h3>
        <p>{x.description}</p>
        <div className={styles.cardFoot}>
          <span className={styles.label}>Free</span>
          {saved && <span className={styles.saved}><CheckIcon size={14} />In my plan</span>}
          <button type="button" className={styles.btn} onClick={onOpen}>Open activity<ArrowIcon size={16} /></button>
        </div>
      </div>
    </article>
  );
}
