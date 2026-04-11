# Suggested prompt for next session

Picking up the lab-handbook hierarchy work after a context clear. R1-R4 are done and deployed (location types + hierarchy tree + 3-col popup + `[[` autocomplete with backlinks). 123/123 Playwright tests green. Issues #18, #19, #20 are closed.

**Read first, in order:**

1. `tests/STATUS.md` — current scores table at top, then Round 1-4 sections (lines ~43-180) for what shipped
2. `tests/R5_PLAN.md` — the R5 scope, design questions, and sub-phases
3. The auto-memory at `project_hierarchy_rounds.md` (loaded automatically) for quick orientation

**R5 = concept/instance migration.** Promote `containers: []` arrays inside reagent files into first-class `bottle` objects with their own `parent:` + `position:` + `lot` + `expiration`. Mirror the pistachio sample model. The plan in `R5_PLAN.md` has 5 open design questions I want you to walk me through before you start writing code — answer them with your recommendation + reasoning, then ask me to confirm or pick differently.

**Don't start coding until we've agreed on the design.** Don't re-derive what R1-R4 already shipped — read the STATUS sections instead.

When you're ready, ask me about the 5 open design questions in `R5_PLAN.md`.
