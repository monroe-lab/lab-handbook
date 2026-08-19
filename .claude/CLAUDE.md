# Monroe Lab Handbook — Site Architecture

## When you start a session

1. Run `gh issue list --repo monroe-lab/lab-handbook --state open` — this is the work queue. Any open issue that isn't reflected in STATUS.md should be added.
2. Read `tests/STATUS.md` — scores table at the top shows what's tested. The most recent round section has the latest context. Scan the "Not yet tested" P0–P4 sections for stale items.
3. Tell Grey what's open and ask what to tackle, unless he's already told you.
4. **Don't start coding until the plan is clear.** If Grey filed a specific issue, that's clear. If it's ambiguous, ask.

## Asking Grey questions

Grey strongly prefers multi-choice questions via the `AskUserQuestion` tool UI over prose asks — it's materially faster for him to click than to read and type. Whenever you need to make a decision mid-task and can enumerate 2–4 plausible options, reach for `AskUserQuestion` instead of a bullet-list question. Lead with a "Recommended" option when you have a clear default. Batch up to 4 related questions in a single call so he answers the set at once. Free-text "Other" is auto-provided by the tool. Only fall back to prose questions for genuinely open-ended asks (naming, spec text, narrative).

## Build & Deploy

- **Always commit and push** every change so the live site matches local. Tests run against the deployed site, not local.
- **SSH port 22 is often blocked** — use `git push ssh://git@ssh.github.com:443/monroe-lab/lab-handbook.git HEAD:main` (do NOT modify git config or ~/.ssh/config).
- **Python scripts require 3.10+** — system python is 3.9. Use `/opt/homebrew/bin/python3.13`.
- **After structural changes** (new types, new directories, new index fields), run both:
  - `/opt/homebrew/bin/python3.13 scripts/build-object-index.py`
  - `/opt/homebrew/bin/python3.13 scripts/build-user-stats.py`
- **Password gate session key** is `monroe-lab-auth` in sessionStorage (the labbot tests set this via `addInitScript`).
- **Deploy takes ~40s** via GitHub Actions after push. Check with `gh run list --repo monroe-lab/lab-handbook --limit 1`.

## What This Is

A lab wiki and handbook for the Monroe Lab at UC Davis, built as a static site with custom interactive apps. It serves two purposes:

1. **Lab handbook** — bioinformatics guides, Farm cluster tutorials, workflow templates (pre-existing content from the original lab-handbook repo)
2. **Wet lab wiki** — protocols, chemical inventory, reagent tracking (content sourced from Grey's Obsidian vault)

**Live site:** https://monroe-lab.github.io/lab-handbook/
**Repo:** https://github.com/monroe-lab/lab-handbook (private, GitHub org `monroe-lab`)
**GitHub plan:** Team (via GitHub Education, faculty coupon, expires Oct 2027)

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Site shell | Custom JS app in `app/` | Plain HTML/JS pages (no framework, no bundler) that fetch and render markdown from `docs/` client-side |
| Content | Markdown in `docs/` | Every page is a `.md` file with YAML frontmatter. There is **no nav file** — pages are auto-discovered |
| Object index | `scripts/build-object-index.py` | Scans `OBJECT_DIRS` under `docs/`, emits `docs/object-index.json` + `docs/link-index.json`. This is what powers search, type browsing, and backlinks |
| Hosting | GitHub Pages | Deployed from an artifact, not a `gh-pages` branch |
| Build/deploy | GitHub Actions | `.github/workflows/deploy.yml` — on push to `main`, runs `check-fab.py` + `build-object-index.py`, assembles `_deploy/` from `docs/` + `app/`, uploads to Pages (~40s) |
| Password gate | Client-side JS | SHA-256 check in `app/js/shared.js` (`PW_HASH`), sessionStorage key `monroe-lab-auth`. Not real security — just a barrier |
| GitHub auth | PAT in `localStorage` | Key `gh_lab_token` (see `app/js/github-api.js`). Fine-grained PAT scoped to `monroe-lab/lab-handbook`, Contents read/write |
| Wikilinks | `app/js/wikilinks.js` + `link-index.json` | `[[target]]` resolved client-side; see resolution rules below |

> **NOT MkDocs.** This repo used to be MkDocs Material and no longer is. There is no
> `mkdocs.yml`, no `overrides/main.html`, no `requirements.txt`, no `mkdocs serve`, and no
> roamlinks plugin. If you see instructions referencing any of those, they are stale. The
> untracked `site/` directory at the repo root is leftover MkDocs build output (gitignored).

## Directory Structure

```
.
├── .claude/CLAUDE.md           # This file
├── .github/workflows/deploy.yml
├── app/                        # The site shell — one HTML file per view
│   ├── index.html              # Dashboard (root redirects here)
│   ├── protocols.html          # Renders any docs/ markdown: ?doc=<path-without-.md>
│   ├── inventory.html, people.html, projects.html, notebooks.html,
│   │   accessions.html, calendar.html, graph.html, lab-map.html, waste.html,
│   │   plasmid-viewer.html, primer-designer.html, solution-maker.html, ...
│   ├── css/
│   └── js/                     # shared.js (gate+BASE), github-api.js, wikilinks.js,
│                               # editor-modal.js, annotate.js, nav.js, types.js, ...
├── docs/                       # All content. Becomes the site root.
│   ├── object-index.json       # GENERATED — do not hand-edit
│   ├── link-index.json         # GENERATED — do not hand-edit
│   ├── user-stats.json         # GENERATED — do not hand-edit
│   ├── resources/              # chemical / consumable / equipment / kit / buffer / enzyme / reagent
│   ├── locations/ stocks/ waste/ samples/ accessions/ people/ events/
│   ├── projects/               # recursive (**/*.md)
│   ├── notebooks/              # recursive (**/*.md)
│   ├── wet-lab/{extraction,library-prep,epigenomics,mutagenesis}/
│   ├── bioinformatics/ lab-safety/ lab-management/ workflow-templates/
│   └── plant-harvesting/ shipping/
├── scripts/                    # build-object-index.py, build-user-stats.py, check-fab.py, migrations
├── tests/                      # labbot.mjs (Playwright) + STATUS.md
└── site/                       # gitignored leftover from the MkDocs era — ignore it
```

## How Things Connect

### Viewing the site
1. User visits `monroe-lab.github.io/lab-handbook/` → meta-refresh to `app/`
2. `app/js/shared.js` gates on password, then on a GitHub PAT (two steps)
3. Password `monroelab`, hashed to `PW_HASH` in `shared.js`; success sets `sessionStorage['monroe-lab-auth']`
4. `404.html` redirects old MkDocs-style URLs to `app/protocols.html?doc=<path>`, so pre-existing links still work

### Adding a page
There is no nav to edit. Drop a `.md` file into one of the `OBJECT_DIRS` (see
`scripts/build-object-index.py`) with frontmatter containing at least `type` and `title`, rerun
`build-object-index.py`, and it appears. Files whose names start with `_` are skipped. Only
`projects/` and `notebooks/` recurse; every other directory is scanned flat, so a page in an
unlisted subdirectory will silently not appear.

### Wikilink resolution (`scripts/build-object-index.py`)
`[[target]]` resolves by, in order:
1. exact path relative to `docs/`, minus `.md`
2. case-insensitive **basename stem** match

Consequence worth knowing: **a directory containing only `index.md` is unreachable by basename
wikilink** (e.g. `projects/anchor-tag/index.md`). Link to those with a relative markdown link
instead. Aliased wikilinks work as `[[target|Alias]]`, but **inside a markdown table the pipe
must be escaped**: `[[target\|Alias]]`.

### Editing content
Lab members edit in-browser via the editor modal (`app/js/editor-modal.js`), which commits
through the GitHub Contents API using their PAT. Grey edits files directly in Obsidian and
pushes. Both paths land in the same repo and trigger the same deploy.

## Obsidian Vault Integration

This repo is cloned into Grey's Obsidian vault at `Obsidian_ProfessorHQ/lab/`. The `docs/wet-lab/` and `docs/lab-safety/` content originated from the vault and is now maintained here as the source of truth.

**Grey's workflow:**
- Edit protocols in Obsidian (files at `Obsidian_ProfessorHQ/lab/docs/wet-lab/`)
- `cd lab && git add -A && git commit -m "update" && git push` to publish
- `git pull` to get lab members' web edits

**Lab members' workflow:**
- Edit via the in-browser editor modal or the inventory view in `app/`
- Changes commit directly to the repo and auto-deploy

Wikilinks like `[[seed-sterilization]]` resolve by filename in Obsidian regardless of directory
depth, and the site's basename-stem fallback matches that behavior — which is why the two stay
compatible. The exception is the `index.md`-only directory case noted above.

## Collaborators

11 lab members have write access to the repo (managed at GitHub org level):
greymonroe, AlicePierce, mariele-lensink, Satoyo08, KehanZhao, ChaeheeLee, matthewwdavis, katyagilmore, Luna-san-2911, vianneyahn, ijdemarco-sys

## Known Issues / TODO

- **Dead wikilinks accumulate when pages are deleted.** Deleting a page does not clean up links
  to it, and the cleanup that removed the Flongle pages left empty link slots
  (`[[a]], , [[b]]`) and a dangling clause mid-sentence in `ot2-hmw-shearing` and
  `pacbio-hifi-sequencing` — fixed 2026-08-19, but the class of bug will recur. After deleting
  a page, grep for its slug across `docs/` **and** `people/*.md` frontmatter `favorites:` lists.
- **`site/` at the repo root** — gitignored leftover MkDocs build output. Harmless, but it will
  confuse a grep. Could be deleted.
- **No local preview story** — the app fetches `docs/` over HTTP relative to `BASE`, so opening
  `app/index.html` from `file://` does not work. Serve the repo root over HTTP if you need one.

## Checking for dead links

```bash
grep -roh '\[\[[^]]*\]\]' docs --include='*.md' \
  | sed 's/\[\[//; s/\]\]//; s/\\|.*//; s/|.*//' | sort -u > /tmp/links.txt
find docs -name '*.md' -not -name '_*' | xargs -n1 basename | sed 's/\.md$//' | sort -u > /tmp/cards.txt
comm -23 /tmp/links.txt /tmp/cards.txt
```

Note for zsh: it does **not** word-split unquoted variables, so a `$FILES` variable holding
space-separated paths is passed as one argument. Use `${=FILES}` or list the files literally.

## Changing the Password

1. Generate a new hash: `echo -n "newpassword" | shasum -a 256`
2. Replace `PW_HASH` in `app/js/shared.js`
3. Commit and push — the site redeploys automatically

## LabBot — Automated Testing

**Before making changes, run LabBot to see the current state. After making changes, run LabBot to verify nothing broke.**

```bash
node tests/labbot.mjs --headed     # watch the bot test every page (preferred)
node tests/labbot.mjs              # headless (faster)
node tests/labbot.mjs --only=wiki  # test just one section
```

LabBot is a Playwright bot that simulates a real authenticated lab member. It creates files, edits content, navigates the freezer map, searches inventory, and cleans up after itself. Auth uses `gh auth token` injected via `context.addInitScript`.

**Tracking doc:** `tests/STATUS.md` — read this first for current test scores, the TODO list of untested features (50+ items, P0-P4), known bugs, and architecture notes.

**Syncing STATUS.md with GitHub Issues:** When reading STATUS.md or when asked about development status, always also run `gh issue list --repo monroe-lab/lab-handbook --state open` to check for new or unresolved issues. Any open issue that isn't already reflected in STATUS.md should be added (as a TODO item under the appropriate priority section, and/or as a bug entry). Closed issues whose fixes aren't noted in STATUS.md should be added as completed items. STATUS.md is the single source of truth for development state — keep it in sync with the issues page.

**Development workflow:** Pick next unchecked item from STATUS.md → implement → add test to `tests/labbot.mjs` → run `--headed` to verify → check box → commit → push.

## Fix Loop — Autonomous Batch Development

`tests/fix-loop.sh` is an autonomous development tool that processes a list of TODO items (fixes, tests, features) by spawning parallel Claude Code agents. Each agent works in its own git worktree, writes Playwright tests, iterates on failures, commits on success, and merges back.

**How it works:**
1. Items are defined as natural language descriptions in the script (id, category, description)
2. Items are grouped into batches of 3-4 that touch different file areas
3. Within each batch, agents run **in parallel** (separate git worktrees)
4. Each agent: reads source code, implements fix/feature, writes Playwright test, runs it (up to 3 retries), commits, updates STATUS.md
5. After a batch completes, branches merge back to main and push
6. Progress tracked in `tests/fix-progress.json` (resumable on interrupt)

**Usage:**
```bash
bash tests/fix-loop.sh              # run (foreground)
nohup bash tests/fix-loop.sh &      # run in background
tail -f tests/fix-loop.log          # monitor
touch tests/fix-pause               # pause between batches
rm tests/fix-pause                  # resume
cat tests/fix-progress.json         # see progress
```

**Adding items:** Edit the `ITEMS` arrays and `run_batch` calls in `fix-loop.sh`. Each item is a triple: `"item-id" "category" "Natural language description of what to do"`. Group items that touch different files into the same batch for parallelism. Items that might edit the same files should go in different batches.

**Results (2026-04-10):** 10/10 items completed (4 verified-already-done, 6 new fixes/features), 0 failures. Delivered: freezer drag-and-drop persistence, concurrent edit handling, offline error messages, floating issue reporter, protocol wikilinks, safety SOP reformatting. Total wall-clock time: ~25 minutes for all 10 items (3 parallel batches).

## Key Design Decisions

- **GitHub PAT over OAuth** — OAuth requires a proxy server. PATs are simpler (one-time paste) and work directly with the GitHub API. The tradeoff is each lab member generates their own token.
- **Dropped MkDocs for a custom JS app** — the site now renders markdown client-side from `app/`. This removed the nav file, the theme override, and the Python build dependency; the cost is that rendering behavior lives in `app/js/` rather than a documented plugin.
- **Markdown files as the data store** — inventory, people, locations, and samples are all `.md` files with YAML frontmatter under `docs/`, not a database or a JSON blob. Version-controlled, visible in the Obsidian vault, readable by Grey Matter agents, and diffable. The JSON files (`object-index.json`, `link-index.json`, `user-stats.json`) are **derived artifacts** — regenerate them, never hand-edit.
- **Password gate is client-side only** — Not real security. The repo is private and Pages is served privately, but the password gate is an additional (cosmetic) barrier. If real security is needed, use Cloudflare Access.
