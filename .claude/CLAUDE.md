# Monroe Lab Handbook — Site Architecture

## When you start a session

1. Run `gh issue list --repo monroe-lab/lab-handbook --state open` — this is the work queue. Any open issue that isn't reflected in STATUS.md should be added.
2. Read `tests/STATUS.md` — scores table at the top shows what's tested. The most recent round section has the latest context. Scan the "Not yet tested" P0–P4 sections for stale items.
3. Tell Grey what's open and ask what to tackle, unless he's already told you.
4. **Don't start coding until the plan is clear.** If Grey filed a specific issue, that's clear. If it's ambiguous, ask.

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
| Static site generator | MkDocs Material | Renders markdown into a themed, searchable site |
| Hosting | GitHub Pages | Served from the `gh-pages` environment via Actions |
| Build/deploy | GitHub Actions | `.github/workflows/deploy.yml` — builds on push to `main`, deploys automatically (~40s) |
| Password gate | Client-side JS | SHA-256 hash check in `overrides/main.html`, sessionStorage-based. Not real security — just a basic barrier. |
| Markdown editor | Custom app (Toast UI Editor) | `docs/editor/index.html` — WYSIWYG Google Docs-like editor, commits via GitHub API |
| Inventory app | Custom app | `docs/inventory-app/index.html` — CRUD inventory management, commits via GitHub API |
| Inventory popups | JS on wiki pages | `docs/javascripts/inventory-links.js` — detects `inventory://` links, shows popup cards |
| Wikilink support | mkdocs-roamlinks-plugin | Resolves `[[wikilinks]]` in markdown (for Obsidian compatibility) |

## Directory Structure

```
.
├── .claude/                    # Claude Code config
│   ├── CLAUDE.md               # This file
│   └── skills/                 # Claude Code skills for Farm workflows
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions: build MkDocs → deploy to Pages
├── .pages.yml                  # Pages CMS config (mostly unused now, editor app replaced it)
├── docs/                       # MkDocs source directory — everything in here becomes the site
│   ├── index.md                # Homepage
│   ├── bioinformatics/         # Farm cluster guides, Linux tutorials, coding philosophy
│   ├── wet-lab/                # Protocols: PCR, gel electrophoresis, seed sterilization, etc.
│   ├── lab-safety/             # Chemical inventory (EHS export)
│   ├── workflow-templates/     # BLAST, HiFi pipeline, Strelka2 templates
│   ├── editor/
│   │   └── index.html          # Rich markdown editor app (standalone, not processed by MkDocs)
│   ├── inventory-app/
│   │   ├── index.html          # Inventory management app (standalone)
│   │   └── inventory.json      # Inventory data (the source of truth for lab inventory)
│   ├── admin/
│   │   ├── index.html          # Redirects to Pages CMS (legacy, editor app is preferred)
│   │   └── config.yml          # Pages CMS config
│   ├── javascripts/
│   │   └── inventory-links.js  # Handles inventory:// link popups on rendered wiki pages
│   └── stylesheets/
│       └── password-gate.css   # (mostly unused now, styles are inline in overrides/main.html)
├── overrides/
│   └── main.html               # MkDocs Material template override — password gate lives here
├── templates/                  # Original Farm workflow templates (sbatch scripts, envs)
├── mkdocs.yml                  # MkDocs config: nav, theme, plugins, extensions
├── requirements.txt            # Python deps: mkdocs-material, mkdocs-roamlinks-plugin
└── README.md                   # Original lab handbook README (for GitHub visitors)
```

## How Things Connect

### Viewing the site
1. User visits `monroe-lab.github.io/lab-handbook/`
2. Password gate (JS in `overrides/main.html`) blocks content until password is entered
3. Password hash checked against SHA-256 in the template. Current password: `monroelab`
4. On success, `sessionStorage` flag set, gate removed. Persists for the browser session.

### Editing content (editor app)
1. User goes to `/editor/` (linked from nav bar as "Edit Wiki")
2. Toast UI Editor loads in WYSIWYG-only mode (no raw markdown visible)
3. File browser sidebar shows all `.md` files from `docs/` (fetched via GitHub Trees API)
4. User selects a file, edits visually, clicks Save
5. App PUTs the updated content to GitHub Contents API (base64 encoded, with SHA for conflict safety)
6. GitHub Actions auto-rebuilds the site

### Editing inventory
1. User goes to `/inventory-app/`
2. App loads `inventory.json` from the repo
3. User adds/edits/deletes items via forms
4. Changes committed to `inventory.json` via GitHub Contents API
5. Inventory data is also used by wiki pages — `inventory://` links in markdown render as teal pills with popup cards

### GitHub authentication for editing
Both the editor and inventory apps use a **GitHub Personal Access Token (PAT)** stored in `localStorage` (key: `github-token`). Shared between both apps (same origin). Lab members generate a fine-grained PAT scoped to `monroe-lab/lab-handbook` with Contents read/write permission. One-time setup per browser.

### Inventory links in protocols
Markdown files can contain links like `[🧪 MS Basal Salt Mixture](inventory://1)` where `1` is the item ID from `inventory.json`. On rendered wiki pages, `inventory-links.js` converts these into styled teal pills. Clicking them shows a popup with quantity, location, notes, SDS search link, and link to the inventory app. The editor app has an "Insert Inventory Item" toolbar button that generates these links.

## Obsidian Vault Integration

This repo is cloned into Grey's Obsidian vault at `Obsidian_ProfessorHQ/lab/`. The `docs/wet-lab/` and `docs/lab-safety/` content originated from the vault and is now maintained here as the source of truth.

**Grey's workflow:**
- Edit protocols in Obsidian (files at `Obsidian_ProfessorHQ/lab/docs/wet-lab/`)
- `cd lab && git add -A && git commit -m "update" && git push` to publish
- `git pull` to get lab members' web edits

**Lab members' workflow:**
- Edit via the editor app at `/editor/` or the inventory app at `/inventory-app/`
- Changes commit directly to the repo and auto-deploy

Wikilinks like `[[seed-sterilization]]` resolve by filename in Obsidian regardless of directory depth.

## Collaborators

11 lab members have write access to the repo (managed at GitHub org level):
greymonroe, AlicePierce, mariele-lensink, Satoyo08, KehanZhao, ChaeheeLee, matthewwdavis, katyagilmore, Luna-san-2911, vianneyahn, ijdemarco-sys

## Known Issues / TODO

- **Editor and inventory app have inconsistent UI** — built in separate passes, need a design consistency pass (header style, token indicator, button styles)
- **Editor toolbar icons** — some Toast UI Editor icons may not render on all browsers due to CSS sprite handling
- **Inventory link insertion in editor** — uses a mode-switch hack (markdown → wysiwyg) that may lose cursor position
- **No offline/local preview** — `mkdocs serve` requires Python + deps installed locally
- **Wikilink warnings during build** — links to vault-only files (people cards, action cards) produce warnings. These are harmless — those files don't exist in the repo.
- **`templates/` directory** — original sbatch scripts and env files from the old repo structure. The MkDocs nav points to flattened copies in `docs/workflow-templates/`. The root `templates/` dir is kept for backward compatibility but could be cleaned up.
- **Pages CMS config** — `.pages.yml` and `docs/admin/` are mostly vestigial. The custom editor app replaced Pages CMS. Can be removed.

## Changing the Password

1. Generate a new hash: `echo -n "newpassword" | shasum -a 256`
2. Replace the hash in `overrides/main.html` (the `EXPECTED_HASH` variable)
3. Commit and push — site rebuilds automatically

## Local Development

```bash
pip install -r requirements.txt
mkdocs serve
# Site at http://localhost:8000/lab-handbook/
```

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
- **Standalone HTML apps over MkDocs plugins** — The editor and inventory apps are plain HTML files, not processed by MkDocs. This keeps them self-contained and avoids MkDocs build complexity.
- **`inventory.json` as data store** — Inventory data lives as a JSON file in the repo. This means it's version-controlled, visible in the vault, and editable by Grey Matter agents. No external database.
- **Password gate is client-side only** — Not real security. The repo is private and Pages is served privately, but the password gate is an additional (cosmetic) barrier. If real security is needed, use Cloudflare Access.
