# Suggested prompt for next session

R1 through R17+ are done and deployed. 248 automated labbot tests green + R17+ features verified via Playwright screenshots. Issues #16–#53 closed (except #52, the big curriculum project). All work is documented in `tests/STATUS.md`.

The big open item is **#52: Molecular Plant Biology Training Curriculum** — a substantial content project to build a full protocol suite for the undergrad training program.

**Read first, in this order:**

1. Run `gh issue list --repo monroe-lab/lab-handbook --state open` — should show #52 as the main open item.
2. Run `gh issue view 52 --repo monroe-lab/lab-handbook` — read the full curriculum plan.
3. `tests/STATUS.md` — current scores table at top, then the Round 17+ section (most recent context). Scan the "Not yet tested" P0–P4 sections further down for any stale items.
4. The auto-memory at `project_hierarchy_rounds.md` (loaded automatically) for orientation.

**What shipped in the most recent session (2026-04-12):**

- **Calendar migration** (#48-50): events are now markdown files at `docs/events/`, calendar reads from object-index, CRUD saves individual `.md` files, duplicate sign-out removed, events carry `created_by`
- **Tiered badges** (#47): 13 categories (Bronze→Diamond), replaced toxic time-badges with lab-operations badges (Location Builder, Stockist, Annotator, Announcer, Scheduler), Bug Hunter now counts issues filed
- **People dashboards** (#51): clicking a person shows notebooks, protocols, events, inventory, locations, projects connected via wikilinks + created_by
- **Frontmatter bar** (#46): compact metadata pills on protocols/wiki/notebooks/projects
- **Dashboard fixes**: bulletin image rendering, profile embed with badges, sticky edit toolbar
- **Protocol template**: media demos restored (images, videos, GIFs, annotations)

**Conventions:**

- **Always commit and push** every change so the live site matches local
- **SSH port 22 may be blocked** — use `git push ssh://git@ssh.github.com:443/monroe-lab/lab-handbook.git HEAD:main`
- **Password gate key** is `monroe-lab-auth` in sessionStorage (not `lab_gate_ok`)
- **Labbot auth** uses `gh auth token` injected via `context.addInitScript`
- **Run `scripts/build-object-index.py` and `scripts/build-user-stats.py`** after structural changes (new types, new directories, new event fields) — use `/opt/homebrew/bin/python3.13` since system python is 3.9
