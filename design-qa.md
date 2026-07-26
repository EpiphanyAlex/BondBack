# BondBack 方案一 Design QA

## Visual truth

- Source visual truth: `/Users/liuyanzhuo/.codex/generated_images/019f99be-809d-76e3-a3f7-23855445b09b/call_OkMc1CdQRRKBlKXuepHjIvqg.png`
- Source pixels: `1487 × 1058`
- Normalized source: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/design-qa-source-normalized.jpg`
- Normalized pixels: `1440 × 1024`
- Normalization: resized to the implementation capture dimensions because the source and target share the same aspect ratio.

## Implementation evidence

- Route: `http://localhost:3000/`
- State: fresh homepage load; amount field showing its `$1,306` placeholder; no modal or hover state.
- CSS viewport: `1440 × 1024`
- Device scale factor: `1`
- Browser-rendered screenshot: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/implementation-desktop-final.jpg`
- Implementation pixels: `1440 × 1024`
- Mobile evidence (`360 × 800`): `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/implementation-mobile-final.jpg`
- Wizard evidence (`360 × 800`): `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/implementation-wizard-mobile.jpg`

## Comparison evidence

- Full-view comparison, source left and implementation right: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/design-qa-comparison.jpg`
- Focused hero comparison, source left and implementation right: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/design-qa-hero-comparison.jpg`
- Character-action comparison at the actual `420 × 280` analysis-slot ratio, homepage left and analysis right: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/character-action-contrast.png`

## Interaction and runtime checks

- Filled `1306` into the homepage amount field and activated `看看几笔站不住`.
- Confirmed navigation to `http://localhost:3000/wizard`.
- Confirmed the wizard retained and displayed `要争的钱 $1,306`.
- Verified the homepage at `360 × 800`; no horizontal overflow or clipped persistent control.
- Browser console warnings/errors checked on the fresh localhost tab: none.

## Findings

- P0: none.
- P1: none.
- P2: none.
- Residual difference: the production侠客 is a purpose-built transparent asset rather than the flattened reference character. It preserves the same crouching evidence-search pose, bamboo-hat silhouette, scroll/books props, ink-and-gold linework, and red evidence tags without baking interface copy into the artwork.

## Comparison history

1. Initial capture: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/implementation-desktop.png`
   - [P2] The right-side character read too small and the black hero region was shorter than the selected visual.
   - Fix: widened the illustration column, increased the desktop illustration stage to `600px`, and scaled the transparent character from the bottom-right origin.
2. Second capture: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/implementation-desktop-v2.png`
   - [P2] Character scale was corrected, but its internal image alignment left excess space below the evidence stack.
   - Fix: bottom-aligned the character image within its stage.
3. Final capture: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/implementation-desktop-final.jpg`
   - Post-fix comparison has no actionable P0/P1/P2 visual differences.
4. Character-action follow-up:
   - [P2] The homepage and analysis characters both used a crouched, close-reading silhouette, so the two stages did not communicate different jobs clearly enough.
   - Fix: kept the homepage magnifying-glass search pose, and replaced the analysis asset with an upright verdict pose: hat on the back, raised statute scroll, red brush connecting evidence slips to clauses.
   - Post-fix evidence: `/Users/liuyanzhuo/.codex/visualizations/2026/07/25/019f99be-809d-76e3-a3f7-23855445b09b/bondback-design-qa/character-action-contrast.png`
   - The two silhouettes, props, eye lines, and actions are now clearly distinct at the production slot size.

final result: passed
