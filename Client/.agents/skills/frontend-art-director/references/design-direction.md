# Design direction and visual hierarchy

Before implementation, decide:

- **Product and users:** what job does this product do; what is the hero action; what information must be visible first?
- **Personality:** pick 3 grounded adjectives (e.g., precise, warm, confident). Avoid vague "premium modern" as the whole brief.
- **Visual thesis:** one sentence explaining the specific visual approach; e.g., "An editorial operations console with a quiet neutral canvas, high-density tables, and restrained electric-blue emphasis."
- **Type system:** one primary typeface and optional contrasting display face already available or legally retrievable; define headline, section, body, supporting text, mono/data roles, line heights and weights. Avoid indiscriminate font mixing.
- **Palette:** background, foreground, muted foreground, surface, borders, primary/action, semantic success/warning/error; validate contrast; use a tight number of colors.
- **Spacing and grids:** consistent 4/8px-derived rhythm, deliberate section spacing, content max-width, responsive grid and navigation patterns.
- **Signature moment:** at most one memorable visual treatment per core view (hero composition, interactive visualization, typographic lockup, timeline, or carefully designed transition).
- **Motion rules:** define entrance, hover, feedback and route transition conventions; support reduced motion.

## Visual quality scorecard (0–5 each)

1. Information architecture: hierarchy and task clarity.
2. Composition: grid, proportions, alignment, rhythm, whitespace.
3. Typography: character, scale, line length, weight and legibility.
4. Visual consistency: tokens, components, states, colors and borders.
5. Interaction quality: affordance, focus, loading and feedback.
6. Motion: intentional, restrained, smooth and accessible.
7. Responsive quality: desktop, tablet, narrow mobile and overflow.
8. Product specificity: looks like *this app*, not a generic template.

A score below 3 on any dimension triggers a targeted revision. Treat scores as qualitative self-checks, not objective proof of quality.

## Anti-pattern -> remedy

- Every section is a row of cards -> vary composition by informational purpose: table, timeline, split view, chart, structured list, workspace.
- Too much blank space and oversized elements -> match density to workflow, compact metadata and increase information usefulness.
- All elements share the same visual weight -> create one dominant action, two secondary levels, and quiet supporting detail.
- More animations than information -> remove motion until hierarchy works statically, then add purposeful transitions.
- Default shadcn visual identity -> customize tokens, proportions, typography, content, and component composition coherently.
- Repeated generic copy -> use accurate content from the project and realistic scenarios.
