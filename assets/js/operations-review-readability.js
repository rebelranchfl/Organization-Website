const css = `
/* Shared readability layer for Operations Review.
   Scope: presentation only. Do not change workflow, data, permissions, or owner controls here. */

#detail,
#detail > *,
#detail section,
#detail article,
#detail .panel,
#detail .progress-card,
#detail .health-card,
#detail .source-review,
#detail .revision-card,
#detail .lifecycle-card,
#detail .artifact-card,
#detail .box,
#detail .metric,
#detail .oi-detail,
#detail .aci-panel,
#detail .aci-path-panel,
#detail .aci-hook,
#detail .aci-step,
#detail .owner-control-card,
#detail .review-box {
  min-width: 0;
  max-width: 100%;
}

#detail,
#detail p,
#detail li,
#detail dd,
#detail dt,
#detail strong,
#detail span,
#detail small,
#detail label,
#detail .muted,
#detail .oi-note,
#detail .aci-note,
#detail .aci-question,
#detail .aci-risk,
#detail .aci-guard,
#detail .queue-meta,
#detail .source-title,
#detail .source-link {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: normal;
}

#detail p,
#detail li,
#detail dd {
  line-height: 1.58;
}

#detail p {
  margin-top: .65rem;
  margin-bottom: .8rem;
}

#detail ul,
#detail ol {
  padding-left: 1.35rem;
}

#detail h3,
#detail h4,
#detail h5 {
  line-height: 1.2;
  overflow-wrap: anywhere;
}

#detail .progress-grid,
#detail .health-grid,
#detail .metrics,
#detail .oi-kpis,
#detail .oi-score-grid,
#detail .aci-kpis,
#detail .aci-layout,
#detail .aci-owner,
#detail .oi-owner,
#detail .source-row,
#detail .detail-head,
#detail .progress-top,
#detail .oi-head,
#detail .aci-head,
#detail .aci-path-head {
  min-width: 0;
}

#detail .progress-grid > *,
#detail .health-grid > *,
#detail .metrics > *,
#detail .oi-kpis > *,
#detail .oi-score-grid > *,
#detail .aci-kpis > *,
#detail .aci-layout > *,
#detail .aci-owner > *,
#detail .oi-owner > *,
#detail .source-row > *,
#detail .detail-head > *,
#detail .progress-top > *,
#detail .oi-head > *,
#detail .aci-head > *,
#detail .aci-path-head > * {
  min-width: 0;
}

/* Dense intelligence content should expand vertically instead of clipping. */
#detail .aci-path-panel,
#detail .aci-hook,
#detail .oi-detail,
#detail .progress-card,
#detail .health-card,
#detail .source-review,
#detail .revision-card,
#detail .lifecycle-card,
#detail .artifact-card,
#detail .box,
#detail .metric {
  height: auto;
  max-height: none;
  overflow: visible;
}

/* Preserve intended horizontal exploration only where the visual itself needs it. */
#detail .aci-flow,
#detail .oi-map-wrap {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-gutter: stable;
}

#detail .aci-flow {
  padding-bottom: 14px;
}

#detail .aci-step {
  min-width: 190px;
  height: auto;
  min-height: 0;
}

#detail .aci-step p,
#detail .aci-step small,
#detail .aci-step strong,
#detail .aci-guard,
#detail .aci-hook,
#detail .aci-hook * {
  overflow-wrap: anywhere;
}

/* Main text panes should never create a hidden horizontal overflow. */
#detail .aci-path-panel,
#detail .aci-layout,
#detail .oi-detail,
#detail .review-box,
#detail .owner-control-card {
  overflow-x: visible;
}

#detail .aci-path-head {
  grid-template-columns: minmax(0, 1fr) auto;
}

#detail .aci-score,
#detail .oi-score,
#detail .bigpct {
  white-space: nowrap;
}

/* Make dense owner-facing summaries easier to scan without redesigning them. */
#detail .aci-hook,
#detail .oi-detail,
#detail .review-phase {
  padding-top: 14px;
  padding-bottom: 14px;
}

#detail .aci-hook > strong:first-child,
#detail .oi-detail > h4:first-child,
#detail .review-phase,
#detail .artifact-group-title {
  letter-spacing: .035em;
}

#detail input,
#detail textarea,
#detail select,
#detail button {
  max-width: 100%;
}

#detail textarea {
  resize: vertical;
}

@media (max-width: 1100px) {
  #detail .aci-layout {
    grid-template-columns: 1fr;
  }

  #detail .oi-kpis,
  #detail .aci-kpis,
  #detail .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  main {
    width: min(100% - 24px, 1280px);
    padding-top: 24px;
  }

  .panel {
    padding: 16px;
  }

  #detail .oi-kpis,
  #detail .aci-kpis,
  #detail .oi-score-grid,
  #detail .metrics,
  #detail .progress-grid,
  #detail .health-grid,
  #detail .aci-owner,
  #detail .oi-owner,
  #detail .source-row,
  #detail .aci-path-head {
    grid-template-columns: 1fr;
  }

  #detail .aci-score,
  #detail .oi-score,
  #detail .bigpct {
    justify-self: start;
  }

  #detail .aci-flow {
    grid-template-columns: repeat(6, minmax(210px, 78vw));
  }
}
`;

if (!document.getElementById('operations-review-readability-styles')) {
  const style = document.createElement('style');
  style.id = 'operations-review-readability-styles';
  style.textContent = css;
  document.head.append(style);
}
