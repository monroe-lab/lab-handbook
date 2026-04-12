The user wants to create a tutorial video for the lab handbook website and publish it.

**Before writing any config, read the philosophy doc:** `/Users/greymonroe/Dropbox/myapps/webtutorial/TUTORIAL_PHILOSOPHY.md` — it defines video length, subtitle rules, cursor pacing, tone, and the Barb M (Barbara McClintock) convention for creating tutorial content.

**Key rules:**
- Under 5 min, ~2 min ideal. Workflow-sized chunks, not atomic tasks.
- All tutorial objects (freezer boxes, protocols, notebooks, samples) are created as **Barb M** (Barbara McClintock persona). Never edit real lab data — create new objects as Barb M.
- Subtitles must never cover the action being demonstrated. Review output.
- No intro preamble, no outro. Just dive in.
- Instructional/observational tone. Short subtitle text.

## Full Pipeline

1. **Probe the live DOM** to verify selectors before writing the config
2. **Write a tutorial config** (JSON) with Playwright step definitions
3. **Generate the video** using the tutorial generator
4. **Review frames** — extract frames per step, check subtitle/visual alignment, fix and re-render
5. **Upload to YouTube** (unlisted) via the upload script
6. **Add to the tutorials page** on the lab handbook site
7. **Commit and push** the updated tutorials page

## Step 0: Probe the DOM First

Before writing selectors based on source code, write a throwaway 30-line Playwright probe script at `/tmp/probe-<task>.mjs` that navigates to the target page with auth and dumps real class names, data-attributes, and element counts. Static source reads miss runtime transformations (e.g., `.md` extensions stripped, class names renamed). A probe catches these in one run vs. two full failed tutorial renders.

Skip only for trivial/well-known selectors.

## Step 1: Write the Tutorial Config

Tutorial configs live in `/Users/greymonroe/Dropbox/myapps/webtutorial/examples/`.

### Auth (Correct Pattern)

The lab handbook uses a client-side password gate (`monroe-lab-auth` sessionStorage) and a GitHub PAT in `localStorage['gh_lab_token']`. Token comes from system `gh` CLI:

```json
{
  "viewport": { "width": 1280, "height": 720 },
  "networkCheck": {
    "url": "https://api.github.com/zen",
    "samples": 3,
    "warnAboveMs": 1500
  },
  "storage": {
    "sessionStorage": { "monroe-lab-auth": "true" },
    "localStorage": {
      "gh_lab_token": "$(gh auth token)",
      "gh_lab_user": "{\"login\":\"greymonroe\",\"avatar\":\"\"}"
    }
  }
}
```

**The localStorage key is `gh_lab_token`, NOT `github-token`.** The user JSON key is `gh_lab_user`.

### Mock Routes (Prevent Real Commits)

Always mock GitHub Contents API writes so tutorials don't commit artifacts to the real repo:

```json
"mockRoutes": [
  {
    "url": "https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/images/**",
    "method": "PUT", "status": 201,
    "body": { "content": { "sha": "mock", "path": "mocked" }, "commit": { "sha": "mock" } }
  },
  {
    "url": "https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/**",
    "method": "PUT", "status": 200,
    "body": { "content": { "sha": "mock", "path": "mocked" }, "commit": { "sha": "mock" } }
  }
]
```

GETs pass through untouched so the UI stays realistic.

### Step Actions

| Action | Purpose | Key Options |
|--------|---------|-------------|
| `navigate` | Go to URL | `url`, `text` |
| `click` | Click element | `selector`, `text`, `dblclick`, `force`, `position: {x,y}` |
| `type` | Click + type into element | `selector`, `typeText`, `text`, `delay` |
| `scroll` | Scroll page or container | `scrollY`, `scrollSelector`, `text` |
| `wait` | Pause, optionally wait for element | `duration`, `waitForSelector`, `waitForTimeout`, `text` |
| `upload` | Set file on input | `selector` (file input), `file`, `triggerSelector` (visible button), `text` |
| `press` | Key press OR type at cursor | `key` OR `typeText`, `triggerSelector`, `settle`, `delay` |
| `exec` | Run arbitrary JS | `script`, `triggerSelector`, `preWait`, `settle`, `text` |

**`triggerSelector`** (on press/exec/upload): Animates cursor to a visible button with highlight + click pulse before running the real action. Purely cosmetic — lets narration say "click Save" while the reliable path is a JS call.

**`force: true`** (on click): Bypasses Playwright actionability checks. Needed for elements under pointer-intercepting overlays (e.g., Toast UI table size picker).

**`dblclick: true`** (on click): Dispatches a `dblclick` MouseEvent via `page.evaluate`. Use for ProseMirror editors where Playwright's native dblclick fails.

**`press` has two modes:**
- `{ key: "Meta+s" }` — keyboard shortcut via `page.keyboard.press`
- `{ typeText: "hello", delay: 55 }` — types at current cursor via `page.keyboard.type` WITHOUT re-focusing. Critical for Tab-navigating ProseMirror table cells.

### Handbook-Specific Selectors

**Protocols page:**
- Category toggle: `.proto-category:has(.material-cat-label:text-is("Wet Lab Basics"))`
- Protocol items: `.proto-item[data-path="wet-lab/quick-dna-extraction"]` — **NO .md extension**
- Rendered body: `#renderedDoc` — wait for this after clicking a protocol
- Main scroll container: `#protoMain` (NOT window) — use `scrollSelector: "#protoMain"`
- Edit button: `.btn.btn-outline.btn-sm:has-text("Edit")`

**Notebooks page:**
- Direct URL: `notebooks.html?doc=notebooks/<folder>/<slug>` — NO `.md` extension
- Main scroll container: `#nbMain`
- Enter edit mode: use `exec` with `script: "if (typeof startEdit === 'function') startEdit();"` — clicking the Edit button times out on ProseMirror pages
- WYSIWYG surface: `.toastui-editor-ww-container .ProseMirror` (NOT the markdown instance)
- Focus editor: `pm.focus()` via exec, NOT `el.click()`

**Lab Map page:**
- Tree nodes: `.tree-node[data-slug='locations/freezer-minus80-a']`
- Toggle expand: use `exec` to add `is-expanded` class and set children `display:block` — the toggle chevron is hidden inside collapsed parents so Playwright can't click it. Use `triggerSelector` pointing at the toggle for the visual cursor.
- Popup overlay: `.em-overlay.open`
- Search: `#treeSearch`
- Expand/Collapse all: `#expandAllBtn`, `#collapseAllBtn`

**Image annotation (gel, etc.):**
- Open annotation overlay: double-click the image with `dblclick: true`
- Canvas: `canvas` (only one when overlay is open)
- Place label: click canvas at `position: {x, y}`, then type into `#annot-text`
- Canvas coordinates: CSS coord = image coord × scale, where scale = min(viewportW×0.95/natW, viewportH×0.7/natH, 1)
- Labels go ABOVE wells (not on bands). Ladder sizes go LEFT of ladder lane.
- Save annotations: `button:has-text("Save annotations")` — ALWAYS mock this route

**Toast UI table insertion:**
- Open size picker: `button[aria-label="Insert table"]`
- Select cell: `.toastui-editor-popup-add-table .toastui-editor-table-row:nth-child(R) .toastui-editor-table-cell:nth-child(C)` — needs `force: true`
- Fill cells: use `press` with `typeText` and Tab navigation (NOT `type` action, which re-clicks)

**ProseMirror cursor-to-end:**
- Click `.toastui-editor-ww-container .ProseMirror > *:last-child`, then `press End`, then `press Enter`
- DOM selection via createRange does NOT sync ProseMirror state

**Viewport centering rule:** Before clicking any element, scroll so it's in the middle third of the screen. Never click at the very bottom or top edge — it looks robotic and the subtitle bar obscures bottom-of-screen actions. Add a `scroll` step (or an `exec` with `scrollIntoView({block:'center'})`) before click steps when the target would otherwise be near the viewport edges. This applies to tree nodes, list items, protocol entries — anything in a scrollable container.

**Network sensitivity:** The handbook fetches from api.github.com on every load. Set generous `waitForSelector` timeouts (15-30s). Use `#renderedDoc` or `.lab-rendered h1` as ready signals.

## Step 2: Generate the Video

```bash
cd /Users/greymonroe/Dropbox/myapps/webtutorial
node generate-tutorial.js examples/<config-name>.json examples/<output-name>.mp4
```

Headless Playwright + ffmpeg conversion. Typical runtime: 30-90 seconds.

## Step 3: Review Loop

**Do NOT skip this.** After rendering:

1. Extract one frame per subtitle-bearing step (use ffmpeg: `ffmpeg -i video.mp4 -vf "select='eq(n,FRAME)'" -vsync vfr frame_%d.png`)
2. Read each frame. Check:
   - Does subtitle text match actual UI state?
   - Is the subtitle bar obscuring important content?
   - Is the cursor in a sensible position?
3. Fix config and re-render if issues found
4. Only report done after review passes

## Step 4: Upload to YouTube

```bash
cd /Users/greymonroe/Dropbox/myapps/webtutorial
python3 youtube_upload.py examples/<output-name>.mp4 "Video Title" "Description" --json
```

Uploads as **unlisted**. Returns JSON with `video_id`, `url`, `embed_url`.
Auth: `~/.grey-matter-credentials/youtube_token.json` (auto-refreshes).

## Step 5: Add to Tutorials Page

Edit `/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/app/tutorials.html`.

```html
<div class="tutorial-card">
  <div class="video-wrap">
    <iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen loading="lazy"></iframe>
  </div>
  <div class="card-body">
    <div class="card-title">Video Title</div>
    <div class="card-desc">Short description.</div>
    <div class="card-tags">
      <span class="card-tag">tag1</span>
    </div>
  </div>
</div>
```

Sections: "Using Our Wiki" (current). Add new `tutorial-section` divs for other categories as needed.

## Step 6: Commit and Push

```bash
cd /Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab
git add app/tutorials.html
git commit -m "Add tutorial: <title>"
git push ssh://git@ssh.github.com:443/monroe-lab/lab-handbook.git HEAD:main
```

## Key Paths

| What | Path |
|------|------|
| Tutorial generator | `/Users/greymonroe/Dropbox/myapps/webtutorial/generate-tutorial.js` |
| YouTube uploader | `/Users/greymonroe/Dropbox/myapps/webtutorial/youtube_upload.py` |
| Tutorial configs | `/Users/greymonroe/Dropbox/myapps/webtutorial/examples/*.json` |
| Generated videos | `/Users/greymonroe/Dropbox/myapps/webtutorial/examples/*.mp4` |
| Philosophy doc | `/Users/greymonroe/Dropbox/myapps/webtutorial/TUTORIAL_PHILOSOPHY.md` |
| Tutorials page | `/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/app/tutorials.html` |
| YouTube OAuth token | `~/.grey-matter-credentials/youtube_token.json` |
| Lab handbook repo | `monroe-lab/lab-handbook` on GitHub |
| LabBot (reference selectors) | `/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/tests/labbot.mjs` |
| Existing example configs | `lab-annotate-gel.json`, `lab-map-navigation.json`, `lab-edit-protocol.json` |
