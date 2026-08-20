"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type Audience = "Parents & Homeschoolers" | "Teens & Young Adults" | "Adults" | "Business Owners" | "Homesteaders";
type LearningArea = { id:string; number:string; title:string; short:string; description:string; outcomes:string; audiences:Audience[] };
type Experience = { id:string; title:string; area:string; audiences:Audience[]; ages:string; time:string; level:string; description:string; learn:string[]; challenge:string };

const audiences:{value:"Everyone"|Audience;label:string;copy:string}[]=[
  {value:"Everyone",label:"See everything",copy:"Explore the full real-life skills curriculum."},
  {value:"Parents & Homeschoolers",label:"Parents & homeschoolers",copy:"Build capable kids with skills they will use for life."},
  {value:"Teens & Young Adults",label:"Teens & young adults",copy:"Learn the skills adulthood will expect you to have."},
  {value:"Adults",label:"Adults",copy:"Learn what many people spend a lifetime figuring out."},
  {value:"Business Owners",label:"Business owners",copy:"Build the knowledge behind a business that works."},
  {value:"Homesteaders",label:"Homesteaders",copy:"Understand food, land, animals, water, and practical independence."},
];

const learningAreas:LearningArea[]=[
  {id:"personal-strength",number:"01",title:"Personal Strength & Independence",short:"Strength & Independence",description:"Confidence, responsibility, accountability, resilience, decision-making, and the ability to move forward when life gets hard.",outcomes:"Think clearly. Choose responsibly. Stand on your own feet.",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults"]},
  {id:"communication",number:"02",title:"Communication & Emotional Intelligence",short:"Communication & EQ",description:"Self-control, healthy boundaries, difficult conversations, conflict, teamwork, relationships, and leadership.",outcomes:"Handle people, pressure, and hard conversations with backbone and respect.",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults","Business Owners"]},
  {id:"business",number:"03",title:"Business & Operations",short:"Business & Operations",description:"Business basics, planning, customer service, pricing foundations, processes, quality, problem-solving, and practical Six Sigma.",outcomes:"Understand the work behind a business that actually works.",audiences:["Teens & Young Adults","Adults","Business Owners"]},
  {id:"money",number:"04",title:"Money, Finance & Taxes",short:"Money, Finance & Taxes",description:"Budgeting, banking, credit, saving, debt, cash flow, pricing, taxes, and making informed financial decisions.",outcomes:"Know where your money goes and understand the systems around it.",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults","Business Owners"]},
  {id:"sustainability",number:"05",title:"Sustainability & Agriculture",short:"Sustainability & Agriculture",description:"Homesteading, real food systems, soil, water, growing, farming, animal stewardship, land care, and resourcefulness.",outcomes:"Work with what you have and understand the systems that sustain life.",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults","Homesteaders"]},
  {id:"family",number:"06",title:"Family, Community & Leadership",short:"Family & Leadership",description:"Capable families, teamwork, responsibility, healthy community, service, leadership, and showing up for the people around you.",outcomes:"Build strong people who can stand alone and still work together.",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults"]},
];

const experiences:Experience[]=[
  {id:"hard-times",title:"Stay Useful in Hard Times",area:"Personal Strength & Independence",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults"],ages:"Ages 12+",time:"40 min",level:"Sample activity",description:"Replace panic with a practical process for seeing what is true, choosing what you control, and taking the next useful step.",learn:["Separate facts from fear","Identify what you can control","Choose the next useful action"],challenge:"Use the process on one real problem you are facing today."},
  {id:"speak-up",title:"Speak Up Without Blowing Up",area:"Communication & Emotional Intelligence",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults","Business Owners"],ages:"Ages 12+",time:"35 min",level:"Sample activity",description:"Practice saying what needs to be said with clarity, confidence, backbone, and respect.",learn:["Name the real issue","Separate facts from assumptions","Make a clear request"],challenge:"Rewrite one heated response as a calm, direct statement."},
  {id:"business-map",title:"Map the Work Behind the Work",area:"Business & Operations",audiences:["Teens & Young Adults","Adults","Business Owners"],ages:"Ages 14+",time:"45 min",level:"Sample activity",description:"See how a customer request moves through a business and find where time, quality, or money gets lost.",learn:["Identify the real starting point","Map the steps and handoffs","Find one avoidable delay"],challenge:"Map one repeated process from request to finished result."},
  {id:"money-map",title:"Build a Real-World Money Map",area:"Money, Finance & Taxes",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults","Business Owners"],ages:"Ages 14+",time:"45 min",level:"Sample activity",description:"See where money comes from, where it goes, and what your choices actually cost.",learn:["Read income and expenses","Separate needs from wants","Plan for a real goal"],challenge:"Map one month of expected income, bills, saving, and spending."},
  {id:"water-ready",title:"How Much Water Do You Really Need?",area:"Sustainability & Agriculture",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults","Homesteaders"],ages:"All ages",time:"30 min",level:"Sample activity",description:"Calculate household water needs and build a practical backup plan using what you already have.",learn:["Estimate daily use","Prioritize drinking and sanitation","Compare practical storage choices"],challenge:"Calculate a three-day water plan for your household."},
  {id:"food-system",title:"See Food as a Life-Sustaining System",area:"Sustainability & Agriculture",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults","Homesteaders"],ages:"All ages",time:"50 min",level:"Sample activity",description:"Follow the connections between soil, water, plants, animals, people, and nourishment.",learn:["Trace inputs and outputs","Recognize useful natural cycles","Design one simple local loop"],challenge:"Draw the food system behind one meal on your table."},
  {id:"team-code",title:"Write Your Family Team Code",area:"Family, Community & Leadership",audiences:["Parents & Homeschoolers","Teens & Young Adults","Adults"],ages:"All ages",time:"45 min",level:"Sample activity",description:"Turn shared values into clear agreements about responsibility, communication, and repairing mistakes.",learn:["Choose values you can act on","Define shared responsibility","Create fair repair rules"],challenge:"Agree on five rules your whole team can explain and use."},
];

export default function Home(){
  const[audience,setAudience]=useState<"Everyone"|Audience>("Everyone");
  const[area,setArea]=useState("All");
  const[selected,setSelected]=useState<Experience|null>(null);
  const[plan,setPlan]=useState<string[]>([]);
  const[done,setDone]=useState<string[]>([]);
  const[menuOpen,setMenuOpen]=useState(false);
  const closeButtonRef=useRef<HTMLButtonElement>(null);

  useEffect(()=>{const timer=window.setTimeout(()=>{setPlan(readSavedList("rra-plan"));setDone(readSavedList("rra-done"))},0);return()=>window.clearTimeout(timer)},[]);
  useEffect(()=>{if(!selected)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";closeButtonRef.current?.focus();const key=(event:KeyboardEvent)=>{if(event.key==="Escape")setSelected(null)};window.addEventListener("keydown",key);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",key)}},[selected]);

  const save=(key:"rra-plan"|"rra-done",value:string[])=>{if(key==="rra-plan")setPlan(value);else setDone(value);try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const relevantAreas=useMemo(()=>audience==="Everyone"?learningAreas:learningAreas.filter(item=>item.audiences.includes(audience)),[audience]);
  const visibleExperiences=useMemo(()=>experiences.filter(item=>(area==="All"||item.area===area)&&(audience==="Everyone"||item.audiences.includes(audience))),[area,audience]);
  const planned=plan.map(id=>experiences.find(item=>item.id===id)).filter(Boolean) as Experience[];
  const completedCount=planned.filter(item=>done.includes(item.id)).length;
  const progress=planned.length?(completedCount/planned.length)*100:0;
  const chooseAudience=(value:"Everyone"|Audience)=>{setAudience(value);if(value!=="Everyone"&&area!=="All"&&!learningAreas.find(item=>item.title===area)?.audiences.includes(value))setArea("All")};
  const chooseArea=(title:string)=>{setArea(title);document.getElementById("sample-learning")?.scrollIntoView({behavior:"smooth",block:"start"})};
  const togglePlan=(id:string)=>save("rra-plan",plan.includes(id)?plan.filter(item=>item!==id):[...plan,id]);
  const toggleDone=(id:string)=>save("rra-done",done.includes(id)?done.filter(item=>item!==id):[...done,id]);

  return <main>
    <header className="site-header">
      <a className="brand-lockup" href="#top" aria-label="Rebel Ranch Academy home"><Image src="/rra-logo.png" alt="" width={1254} height={1254}/><span><small>Rebel Ranch Ministries</small><strong>Rebel Ranch Academy</strong></span></a>
      <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={()=>setMenuOpen(open=>!open)}>{menuOpen?"Close":"Menu"}</button>
      <nav id="primary-navigation" className={menuOpen?"nav-open":""} aria-label="Primary navigation">
        <a href="#learning-areas" onClick={()=>setMenuOpen(false)}>Learning areas</a>
        <a href="#sample-learning" onClick={()=>setMenuOpen(false)}>Try the Academy</a>
        <a href="#my-plan" onClick={()=>setMenuOpen(false)}>My learning plan <b aria-label={`${plan.length} saved activities`}>{plan.length}</b></a>
        <a className="rrm-return" href="https://rebelranchministries.org/">Visit Rebel Ranch Ministries</a>
      </nav>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">REBEL RANCH MINISTRIES PRESENTS</p>
        <h1>Build the skills<span>life expects.</span></h1>
        <p className="hero-lede">Real-life education for children, teens, and adults who want to think clearly, communicate well, understand how things work, and become more capable.</p>
        <div className="hero-actions"><a className="button button-gold" href="#choose-your-path">Find your path <span aria-hidden="true">→</span></a><a className="button button-outline" href="#sample-learning">Try a sample activity</a></div>
        <p className="hero-note">Respectable. Responsible. Accountable. Confident. Independent. Strong.</p>
      </div>
      <div className="hero-seal" aria-label="Official Rebel Ranch Academy seal"><div className="seal-glow" aria-hidden="true"/><Image src="/rra-logo.png" alt="Rebel Ranch Academy. Skills for life. Freedom for all." width={1254} height={1254} priority/></div>
    </section>

    <section className="declaration" aria-label="Academy promise"><p>Beyond traditional education.</p><strong>Real skills for real life.</strong><p>Online learning. Real-world action.</p></section>

    <section className="audience-section" id="choose-your-path">
      <SectionHeading kicker="CHOOSE YOUR PATH" title="Start with the life you are living." copy="The Academy covers a lot of ground because real life does too. Choose who you are learning for, and we will narrow the path."/>
      <div className="audience-grid" role="group" aria-label="Choose an audience">{audiences.map(item=><button key={item.value} type="button" className={audience===item.value?"audience-choice selected":"audience-choice"} aria-pressed={audience===item.value} onClick={()=>chooseAudience(item.value)}><span>{item.label}</span><small>{item.copy}</small></button>)}</div>
      <p className="selection-note" aria-live="polite">Showing paths for <strong>{audience}</strong></p>
    </section>

    <section className="learning-section" id="learning-areas">
      <SectionHeading kicker="THE REAL-LIFE CURRICULUM" title="Six learning areas. One capable human." copy="Each area builds knowledge people can use at home, at work, in relationships, in business, and in the community."/>
      <div className="learning-grid">{relevantAreas.map(item=><button className="learning-card" key={item.id} type="button" onClick={()=>chooseArea(item.title)}><span className="area-number">{item.number}</span><div><h3>{item.title}</h3><p>{item.description}</p><strong>{item.outcomes}</strong></div><span className="card-link">Explore sample learning →</span></button>)}</div>
    </section>

    <section className="roots-feature">
      <div className="roots-logo"><Image src="/roots-boots-animal-poops-logo.png" alt="Roots, Boots and Animal Poops" width={1254} height={1254}/></div>
      <div className="roots-copy"><p className="eyebrow">SUSTAINABILITY &amp; AGRICULTURE</p><h2>Real food starts long before the store.</h2><p>Roots, Boots &amp; Animal Poops is where children, adults, homesteaders, and homeschool families learn how soil, water, plants, animals, food, and responsible stewardship work together.</p><p className="program-endorsement">Roots, Boots &amp; Animal Poops is a Rebel Ranch Academy program.</p><button className="button button-gold" type="button" onClick={()=>chooseArea("Sustainability & Agriculture")}>Explore agriculture learning <span aria-hidden="true">→</span></button></div>
    </section>

    <section className="experience-section" id="sample-learning">
      <SectionHeading kicker="TRY THE ACADEMY" title="Learn something you can use." copy="These sample activities show how RRA learning works. Every lesson ends with something to do, decide, build, practice, or change."/>
      <div className="filter-row" role="group" aria-label="Filter sample learning">
        <button type="button" className={area==="All"?"active":""} aria-pressed={area==="All"} onClick={()=>setArea("All")}>All relevant areas</button>
        {relevantAreas.map(item=><button type="button" key={item.id} className={area===item.title?"active":""} aria-pressed={area===item.title} onClick={()=>setArea(item.title)}>{item.short}</button>)}
      </div>
      <div className="experience-grid">{visibleExperiences.map(item=><article className={done.includes(item.id)?"experience-card complete":"experience-card"} key={item.id}><div className="experience-meta"><span>{item.level}</span><span>{item.ages} · {item.time}</span></div><p className="area-label">{item.area}</p><h3>{item.title}</h3><p>{item.description}</p><div className="card-actions"><button type="button" onClick={()=>setSelected(item)}>Open activity <span aria-hidden="true">→</span></button><button type="button" className={plan.includes(item.id)?"saved":""} onClick={()=>togglePlan(item.id)}>{plan.includes(item.id)?"Remove from my plan":"+ Add to my plan"}</button></div></article>)}</div>
      {visibleExperiences.length===0&&<div className="no-results"><strong>No sample activity is posted for this exact combination yet.</strong><p>Choose another learning area or view all relevant areas.</p><button type="button" onClick={()=>setArea("All")}>View all relevant activities</button></div>}
    </section>

    <section className="plan-section" id="my-plan">
      <div className="plan-intro"><p className="eyebrow">YOUR NEXT MOVE</p><h2>Build your own learning path.</h2><p>Save sample activities here and mark them complete when the real work is done. Your plan stays on this device and is not connected to an account.</p></div>
      <div className="plan-board"><div className="progress" role="progressbar" aria-label="Learning plan progress" aria-valuemin={0} aria-valuemax={planned.length} aria-valuenow={completedCount}><span style={{width:`${progress}%`}}/></div><p>{completedCount} of {planned.length} complete</p>{planned.length===0?<div className="empty-plan"><strong>Your learning plan is wide open.</strong><p>Add a sample activity that solves a problem you actually have.</p><a href="#sample-learning">Browse sample learning →</a></div>:<ul className="plan-list">{planned.map(item=><li key={item.id}><button className={done.includes(item.id)?"check checked":"check"} type="button" onClick={()=>toggleDone(item.id)} aria-label={`Mark ${item.title} ${done.includes(item.id)?"incomplete":"complete"}`}>{done.includes(item.id)?"✓":""}</button><button className="plan-title" type="button" onClick={()=>setSelected(item)}>{item.title}<small>{item.area} · {item.time}</small></button><button className="remove" type="button" onClick={()=>togglePlan(item.id)} aria-label={`Remove ${item.title} from your plan`}>×</button></li>)}</ul>}</div>
    </section>

    <section className="interest-section"><p className="eyebrow">RESPONSIBLE REBELS WANTED</p><h2>You do not have to know everything.<span>You do need to keep learning.</span></h2><p>Tell Rebel Ranch Ministries what you want to learn. Your interest helps shape which Academy programs move forward first.</p><a className="button button-gold" href="https://rebelranchministries.org/academy-learning-interest.html">Share what you want to learn <span aria-hidden="true">→</span></a></section>

    <footer><div className="footer-brand"><Image src="/rra-logo.png" alt="" width={1254} height={1254}/><div><strong>Rebel Ranch Academy</strong><span>Real skills for real life.</span></div></div><div className="footer-links"><a href="https://rebelranchministries.org/">Rebel Ranch Ministries</a><a href="#learning-areas">Academy learning areas</a><a href="https://rebelranchministries.org/contact.html">Contact</a></div><p className="legal">Rebel Ranch Academy is a program of Rebel Ranch Ministries, a ministry program under Faith, Family &amp; Nature Church, Inc.</p></footer>

    {selected&&<div className="modal-backdrop" onMouseDown={()=>setSelected(null)}><section className="lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-title" onMouseDown={event=>event.stopPropagation()}><button ref={closeButtonRef} className="modal-close" type="button" onClick={()=>setSelected(null)} aria-label="Close activity">×</button><p className="eyebrow">{selected.area}</p><p className="modal-meta">{selected.level} · {selected.ages} · {selected.time}</p><h2 id="lesson-title">{selected.title}</h2><p className="lesson-description">{selected.description}</p><h3>What you will learn</h3><ol>{selected.learn.map((item,index)=><li key={item}><span>0{index+1}</span>{item}</li>)}</ol><div className="challenge"><strong>Put it to work</strong><p>{selected.challenge}</p></div><div className="modal-actions"><button className="button button-gold" type="button" onClick={()=>togglePlan(selected.id)}>{plan.includes(selected.id)?"Remove from my plan":"Add to my plan →"}</button><button className="button button-dark" type="button" onClick={()=>toggleDone(selected.id)}>{done.includes(selected.id)?"✓ Completed":"Mark complete"}</button></div></section></div>}
  </main>
}

function SectionHeading({kicker,title,copy}:{kicker:string;title:string;copy:string}){return <div className="section-heading"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div><p>{copy}</p></div>}

function readSavedList(key:"rra-plan"|"rra-done"){
  if(typeof window==="undefined")return [];
  try{
    const value=JSON.parse(localStorage.getItem(key)||"[]");
    return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];
  }catch{
    return [];
  }
}
