# Rebel Ranch Academy — Business Value Tracker Project Status

**Status:** Owner-approved project record  
**Last updated:** 2026-09-10  
**Current phase:** Phase 1 built; Phase 2 documented as next build and intentionally paused  
**Program:** Rebel Ranch Academy (RRA)  
**Parent:** Rebel Ranch Ministries (RRM) / Faith, Family & Nature Church, Inc. (FFN)

## Purpose

This project turns the valuation work first built for Rebel Ranch Ministries into a reusable Academy tool that can later be offered to small businesses, startups, nonprofits, or people who have an idea and want help understanding what they have built, what it may be worth, and what steps could increase its value.

The tool must remain understandable to ordinary users. It is not intended to be a blank calculator that lets a person type any value they want and then presents that number as fact.

## Phase 1 — Structure and storage

**Phase 1 is built.**

Phase 1 created the underlying Supabase structure needed to store customizable valuation projects. The current backend contains separate areas for:

- projects;
- assets and intellectual property;
- valuation assessments;
- research/evidence sources;
- assumptions and user-supplied inputs; and
- action-plan steps.

The first working project is the current RRM valuation. It stores the present RRM asset/IP inventory, valuation ranges, research sources, assumptions, and 10-step action tracker.

### Current RRM reference values stored in the system

The current research-supported IP market-value range is:

- low: **$175,000**;
- central / working value: **$365,000**;
- high: **$670,000**.

The current economic reproduction/replacement-cost range is:

- low: **$224,750**;
- central: **$319,500**;
- high: **$419,000**.

These are different valuation lenses and must not be added together as though they were separate assets.

The system also stores the beginning tangible/productive-asset inventory and the RRM capitalization/property action plan. Those portions remain incomplete until the remaining animals, equipment, infrastructure, founder contributions, revenue/traction, contracts, funding pipeline, land rights, and other assets are fully documented.

## Phase 1 limitation

The Phase 1 system **stores and organizes information. It does not yet independently research and prove a user's valuation.**

A user could currently provide a description, assumption, or number and the database could store it. That alone does not make the number researched, supported, verified, or suitable to present as market value.

This limitation is the reason Phase 2 is required before this becomes a trustworthy sellable valuation product.

# Phase 2 — Research and valuation engine

**Phase 2 is the next build. It is documented here but is not authorized for implementation in this session.**

The goal of Phase 2 is to make the product behave more like an analyst than a blank spreadsheet.

A normal user should describe what they have built in ordinary language. The system should then research the asset, collect outside evidence, compare it with relevant market information, calculate a supportable range, explain the reasoning, and save both the result and its evidence.

## Intended Phase 2 user flow

A user should be able to say something like:

> I built a scheduling app for contractors that sends quotes, reminders, and payment links.

The future Phase 2 system should then:

1. break the description into the actual asset or product type, features, industry, stage of completion, ownership, users, revenue, integrations, and other value-driving facts;
2. identify which valuation methods apply;
3. research current market comparables;
4. research current development/reproduction pricing where useful;
5. check relevant patent records when the asset may contain a patentable invention or technology;
6. check relevant trademark/brand conflicts or registrations when brand rights are important;
7. gather actual outside sources and record when each source was checked;
8. calculate a low, central, and high value range;
9. explain why those numbers were selected;
10. assign a confidence level based on the quality and quantity of evidence;
11. clearly separate user-provided claims from researched or verified facts; and
12. save the complete research trail and valuation back into the existing Phase 1 Supabase structure.

## Required valuation evidence rule

A user-entered number must never automatically become a researched or verified value.

The system should keep at least three different kinds of numbers separate:

### 1. User-reported value

What the owner thinks the asset is worth or what the owner reports it cost.

This is useful context but remains **self-reported** until evidence supports it.

### 2. System-researched estimate

A value calculated from current market comparables, development/reproduction benchmarks, relevant transactions, current pricing, industry data, or other appropriate outside evidence.

This should always retain the sources and reasoning used.

### 3. Verified value evidence

Evidence stronger than an estimate, such as:

- actual invoices;
- completed sales;
- license agreements;
- customer contracts;
- documented recurring revenue;
- purchase offers;
- app/service revenue;
- independent appraisals or valuations; or
- other direct transaction evidence.

The system must never silently present one category as another.

## Source requirement

No value may be labeled **researched**, **supported**, or **verified** without source evidence attached to that valuation record.

The future engine should store, at minimum:

- source title;
- publisher or provider;
- source URL or record identifier when available;
- date accessed;
- what fact or benchmark came from the source;
- why the source is relevant;
- valuation method using that evidence; and
- confidence level.

A purely user-entered figure should display clearly as **self-reported / not independently verified**.

## Market-comparable research

Phase 2 should search for comparable products, software, services, systems, curricula, brands, intellectual property, businesses, or other assets that resemble the user's asset closely enough to provide useful evidence.

The system should not treat a loosely related product as a valid comparable merely because it is in the same broad industry.

Comparable research should consider factors such as:

- actual features and capabilities;
- development maturity;
- customer type;
- market/industry;
- recurring versus one-time revenue;
- amount of automation;
- intellectual-property rights;
- implementation requirements;
- user/customer traction;
- commercialization rights; and
- current market pricing.

## Patent research

Patent research may be relevant for inventions, technical processes, software/technology claims, devices, methods, or other potentially patentable assets.

Phase 2 should be able to search authoritative or widely used patent sources such as the United States Patent and Trademark Office (USPTO), Google Patents, and the World Intellectual Property Organization (WIPO) patent databases when appropriate.

The system must explain that finding a similar patent does not by itself determine an asset's value. Patent research helps answer questions such as:

- whether similar inventions or claims already exist;
- whether the area appears crowded;
- whether an issued patent or published application is relevant;
- whether the user's idea appears more or less differentiated; and
- whether specialist patent review may be appropriate.

The tool must not represent automated patent searching as a legal patentability or freedom-to-operate opinion.

## Trademark and brand research

For brand-heavy assets, Phase 2 may also check relevant trademark records and current market use of similar names or marks.

The purpose is to improve the evidence around brand strength, uniqueness, commercial usability, and ownership—not to claim that an automated search replaces a legal trademark opinion.

## Valuation methods

The engine should choose the valuation method that fits the asset rather than forcing everything through one formula.

Potential methods include:

- cost/reproduction approach — what it would cost to recreate the asset;
- market approach — what comparable products/assets/transactions suggest;
- income approach — what the asset can reasonably generate in future cash flow, licensing, or revenue;
- current tangible/fair-market-value approach for physical assets;
- productive-value analysis for assets that repeatedly generate output, such as breeding livestock;
- startup/milestone/scorecard approaches for early ventures without mature financial history; and
- multiple methods together when a cross-check makes the result stronger.

The system should show the different lenses rather than hiding them inside one unexplained number.

## Confidence scoring

Every researched valuation should receive a confidence rating based on the actual evidence available.

Examples:

- **Strong:** multiple current, close comparables and direct financial/transaction evidence;
- **Moderate:** useful current comparables and reasonable assumptions, but limited direct transaction evidence;
- **Weak:** sparse comparables, mostly owner-supplied assumptions, or a very early/unproven asset.

The confidence score must not be cosmetic. It should respond to source quality, source freshness, closeness of comparables, completeness of user evidence, and availability of real financial results.

## Customization without destroying evidence

Users should be able to change planning assumptions and see how the value changes.

Examples include:

- customer count;
- license price;
- annual sales;
- growth assumptions;
- development hours;
- labor rates;
- production output;
- number of productive assets; and
- other scenario inputs.

Changing a planning assumption must not overwrite or erase the researched source evidence that produced the original valuation.

The system should preserve an audit trail so a user can distinguish:

**original research → user-adjusted scenario → updated researched valuation.**

## Research freshness

Market data changes. Phase 2 should store the date each source and valuation was researched and support later re-research/recalculation.

The product should not silently continue presenting stale market pricing as current.

## Commercial direction

This project is intended to become more than an internal RRM spreadsheet.

The long-term product direction is a guided business/IP value and planning tool for:

- people with a business idea;
- startups;
- small businesses;
- nonprofit ventures;
- creators/inventors;
- people developing intellectual property; and
- people who need help understanding what assets and value they may already have.

The product should help ordinary people understand the difference between cash, assets, intellectual property, market value, replacement/reproduction cost, productive value, enterprise value, and future income potential in plain language.

It should help a person answer:

> What do I actually have, what might it reasonably be worth, what evidence supports that value, and what should I do next to strengthen it?

## Current status / stop point

### Verified current state

- Phase 1 backend structure exists in Supabase.
- The RRM working valuation is stored as the first project.
- The current structure separates assets, assessments, sources, assumptions, and action steps.
- Row-level security is enabled on the valuation tables.
- The matching database migration is recorded in GitHub.

### Not built yet

Phase 2 research automation is **not built**.

The current system does not yet:

- perform independent web research for a user's asset;
- automatically search market comparables;
- search patents or trademarks;
- automatically score evidence quality;
- automatically calculate a researched valuation from new user descriptions;
- automatically refresh stale source data;
- produce a finished customer-facing valuation report; or
- provide the final sellable Academy user interface.

## Next authorized build when this project resumes

**Phase 2 — Research and Valuation Engine.**

Resume by designing and verifying the complete research pipeline before adding automation. The first Phase 2 design task should define:

**USER DESCRIPTION → ASSET CLASSIFICATION → REQUIRED EVIDENCE → MARKET/PATENT/TRADEMARK RESEARCH AS APPLICABLE → SOURCE CAPTURE → VALUATION METHOD → LOW/CENTRAL/HIGH CALCULATION → CONFIDENCE SCORE → EXPLANATION → SAVE TO SUPABASE → USER REPORT**

Do not begin by merely adding more user-editable number fields. The purpose of Phase 2 is to make the numbers evidence-driven.

## Project hold

Per owner instruction on 2026-09-10, the project is intentionally paused here so work can return to the prior priority.

When work resumes, read `/AGENTS.md`, `/rebel ranch academy/AGENTS.md`, this project record, the current shared-systems authority, and the actual current Supabase/repository state before making the next change.

AI-Agent: ChatGPT/GPT-5.6 Sol  
Session: RRM property, valuation and capitalization planning
