# Visual QA and release gate

## Inspection loop

1. **Capture:** actual page at desktop and mobile sizes, ideally a few meaningful application states; note viewport and route.
2. **Diagnose:** list the three most consequential visual or usability failures, with location and reason (e.g., primary CTA lost against equally saturated cards; table overflows 390px viewport; nav icon contrast fails).
3. **Prioritize:** fix hierarchy, composition, responsive breakage and readability before micro-polish.
4. **Change:** make targeted code edits, not a full arbitrary restyling every iteration.
5. **Verify:** recapture after edits and assess whether the specific problems improved. Repeat as needed.

## Acceptance criteria

- Primary purpose is understandable within first view; key action discoverable.
- Text, buttons and data are legible across desktop and narrow mobile.
- No unintended horizontal overflow, clipping, overlapping navigation, or huge dead zones.
- Keyboard navigation and visible focus work for interactive components.
- Hover is not the only way to reveal required content; touch interactions work.
- Loading, empty, error, and success affordances make sense for major workflows.
- Animation does not hide content, obstruct interactions or disregard reduced-motion preferences.
- Visual patterns feel like one product rather than a collage of library demos.
- No accidental changes to APIs, core behavior, user data, or real product claims.
- Relevant build, typecheck, lint and tests pass, or remaining failures are clearly identified.

## Reporting template

**Design thesis:** [specific direction]
**Changes:** [routes/components and rationale]
**Tool audit:** [actually used Taste, shadcn, React Bits, GSAP, browser tools; distinguish unavailable]
**Visual iterations:** [observed problems, fixes, and re-checks; or limitation]
**Validation:** [commands run and precise results]
**Known gaps:** [remaining defects or tasks]
