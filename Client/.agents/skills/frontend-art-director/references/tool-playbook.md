# Tool integration playbook

The skill is an orchestrator, **not** an installer or substitute for separate skills/MCP connections. Inspect actual tool availability first.

## Taste Skill

If installed and callable, read its own instructions and use its framework to critique typography, composition, hierarchy, polish and AI-template patterns. Do not pretend to have executed it if unavailable. Do not blindly follow aesthetic feedback over app usability.

## shadcn/ui and shadcn MCP

Inspect `components.json`, package versions and available registries. Reuse existing accessible primitives (Dialog, Popover, Tabs, Form, Button, Select, etc.) where appropriate. Use the shadcn MCP to discover/fetch registry components when connected and useful; inspect generated code, check package peer dependencies and licensing, adapt to existing tokens. Do not use a registry component merely to increase component count.

## React Bits

Use as a selective accent for a high-value moment: hero treatment, tactile hover, meaningful text animation, or interaction feedback. Check React/framework compatibility, SSR/client boundaries, dependencies, layout stability, bundle impact, keyboard semantics and reduced motion. Prefer zero or one signature component per screen over an assortment of unrelated effects. If the user's environment accesses React Bits via shadcn registry, verify the MCP registry configuration first.

## GSAP

Use for timeline-driven choreography that CSS alone would make awkward. For React, prefer `@gsap/react` with `useGSAP` and appropriate scoping/context cleanup. Animate primarily opacity/transforms, avoid layout thrashing, and use `gsap.matchMedia()` or equivalent for responsive/reduced-motion handling when relevant. Do not animate critical content so that it is inaccessible before JS loads. Avoid installing ScrollTrigger if no scroll-driven interaction is needed. Do not make the page feel slow to use.

## Browser or computer-use tools

If available, start the dev server, open the UI at typical desktop (about 1440px) and mobile (about 390px) widths, and inspect actual screenshots. Check nav, primary tasks, dialogs, scrolled content, form states, empty/loading/error states, focus and overflow. If screenshot inspection cannot be done, clearly state that limitation and use code review plus tests as fallback; never hallucinate screenshots.

## Suggested sequence

Taste Skill (art direction critique) -> shadcn foundation -> custom composition -> React Bits *if justified* -> GSAP meaningful motion -> browser critique -> revise -> lint/typecheck/build. Sequence may change based on existing code and user request.
