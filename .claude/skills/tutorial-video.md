The user wants to create a tutorial video for the lab handbook website and publish it.

## REQUIRED READING — Do This First

Before writing ANY config or code, read these files in order:

1. **`/Users/greymonroe/Dropbox/myapps/webtutorial/TUTORIAL_PHILOSOPHY.md`** — Video length, pacing, subtitle rules, cursor behavior, viewport centering, the Barb M persona, voice narration, and all creative guidelines. This is the style guide.

2. **`/Users/greymonroe/Dropbox/myapps/webtutorial/generate-tutorial.js`** — The generator source. Read it to understand all step actions, their options, and the subtitle bar / voice narration features.

3. **Existing example configs in `/Users/greymonroe/Dropbox/myapps/webtutorial/examples/`** — Study `lab-annotate-gel.json`, `lab-map-objects.json`, and `lab-map-navigation.json` for real-world patterns: auth setup, mock routes, tree expansion via exec, modal handling, ProseMirror workarounds.

4. **`/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/tests/labbot.mjs`** — The canonical reference for Playwright selectors and auth patterns on the lab handbook site. If you need a selector, check labbot first.

## Key Rules (Summary — Details in Philosophy Doc)

- **Under 5 min, ~2 min ideal.** Workflow-sized chunks, not atomic tasks.
- **Barb M (Barbara McClintock) persona.** All tutorial objects (freezer boxes, protocols, notebooks) are created as Barb M. Never edit real lab data.
- **Subtitles never cover the action.** The subtitle bar sits below the page content (enabled by default).
- **Scroll targets to mid-screen before clicking.** Never click at viewport edges.
- **Slower pacing.** Give viewers 3+ seconds to read subtitles and absorb what's on screen.
- **Use the cursor as a pointer.** Hover over items being discussed, don't just click and move on.
- **No intro/outro.** Just dive in.
- **Instructional/observational tone.** Short subtitle text.
- **Voice narration is ON by default.** Set `"voice": true` in config. Randomly picks from Ava, Emma, Natasha, or Guy (Edge TTS neural voices). Pin a specific voice with `"voice": { "name": "en-US-EmmaNeural" }`.
- **Voice sync is automatic.** The generator waits for each voice clip to finish before advancing to the next subtitle. No manual timing needed.

## Full Pipeline

1. **Probe the live DOM** (if writing new selectors for pages not in examples)
2. **Write a tutorial config** (JSON)
3. **Generate the video**
4. **Review frames** — check subtitle/visual alignment
5. **Upload to YouTube** (unlisted)
6. **Add to tutorials page** on the lab handbook site
7. **Commit and push**

## Config Format

Configs live in **`/Users/greymonroe/Dropbox/myapps/webtutorial/examples/`**.

### Minimal Config Template

```json
{
  "viewport": { "width": 1280, "height": 720 },
  "subtitleBar": true,
  "voice": true,
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
  },
  "mockRoutes": [
    {
      "url": "https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/**",
      "method": "PUT",
      "status": 200,
      "body": { "content": { "sha": "mock" }, "commit": { "sha": "mock" } }
    }
  ],
  "steps": []
}
```

### Auth Keys (EXACT — Do Not Change)

- `sessionStorage`: `monroe-lab-auth` = `"true"` (password gate bypass)
- `localStorage`: `gh_lab_token` = `"$(gh auth token)"` (GitHub PAT, resolved at runtime)
- `localStorage`: `gh_lab_user` = `"{\"login\":\"greymonroe\",\"avatar\":\"\"}"` (user identity)

### Voice Config

- `"voice": true` — randomly picks from: Ava, Emma, Natasha, Guy (Edge TTS)
- `"voice": { "name": "en-US-AvaNeural" }` — pin a specific voice
- Omit `"voice"` entirely for silent video
- Requires `edge-tts` installed: `/Users/greymonroe/Library/Python/3.9/bin/edge-tts`
- Voice clips are pre-generated before recording; step durations auto-extend to match audio length
- The generator waits for each voice clip to finish before advancing — no overlap

### Subtitle Bar

- `"subtitleBar": true` (default) — 90px dark bar below page content. Subtitles render inside, never overlap content.
- `"subtitleBar": false` — floating overlay pill (legacy mode)
- `"subtitleBarHeight": 90` — adjustable, default 90px

### Step Actions

| Action | Purpose | Key Options |
|--------|---------|-------------|
| `navigate` | Go to URL | `url`, `text` |
| `click` | Click element | `selector`, `text`, `dblclick`, `force`, `position: {x,y}` |
| `type` | Click + type into element | `selector`, `typeText`, `text`, `delay` |
| `scroll` | Scroll page or container | `scrollY`, `scrollSelector`, `text` |
| `wait` | Pause, optionally wait for element | `duration`, `waitForSelector`, `waitForTimeout`, `text` |
| `upload` | Set file on input | `selector` (file input), `file`, `triggerSelector`, `text` |
| `press` | Key press OR type at cursor | `key` OR `typeText`, `triggerSelector`, `settle`, `delay` |
| `exec` | Run arbitrary JS | `script`, `triggerSelector`, `preWait`, `settle`, `text` |

**`triggerSelector`** (on press/exec/upload): Animates cursor to a visible button before running the real action. Use when the reliable code path is JS but narration says "click X."

**`force: true`** (on click): Bypass Playwright actionability checks. Needed for elements under overlays.

**`dblclick: true`** (on click): Dispatch dblclick via JS. Use for ProseMirror editors.

**`press` two modes:**
- `{ key: "Meta+s" }` — keyboard shortcut
- `{ typeText: "hello", delay: 55 }` — type at current cursor WITHOUT re-focusing (critical for ProseMirror table cells)

### Common Patterns

**Expanding tree nodes (Lab Map):** Tree children are `display:none` when collapsed. Playwright can't click hidden elements. Use `exec` to expand programmatically with `triggerSelector` for the visual cursor:
```json
{
  "action": "exec",
  "script": "var n = document.querySelector('.tree-node[data-slug=\"locations/room-robbins-0170\"]'); if(n){n.classList.add('is-expanded'); var c=n.querySelector(':scope > .tree-children'); if(c) c.style.display='block';}",
  "triggerSelector": ".tree-node[data-slug='locations/room-robbins-0170'] > .tree-node-row .tw-toggle",
  "text": "Expand the room to see what's inside.",
  "settle": 600
}
```

**Scrolling target to center before clicking:**
```json
{
  "action": "exec",
  "script": "var el = document.querySelector('.tree-node[data-slug=\"locations/box-pistachio-dna\"] > .tree-node-row'); if(el) el.scrollIntoView({block:'center', behavior:'smooth'});",
  "text": "",
  "settle": 600
}
```

**Closing the editor modal:**
```json
{
  "action": "exec",
  "script": "var o = document.querySelector('.em-overlay.open'); if(o) { o.classList.remove('open'); }",
  "text": "",
  "settle": 800
}
```

**Entering edit mode (ProseMirror-safe):**
```json
{
  "action": "exec",
  "script": "if (typeof startEdit === 'function') startEdit();",
  "triggerSelector": "button.btn.btn-outline.btn-sm:has-text(\"Edit\")",
  "text": "Click Edit to modify."
}
```

### Handbook-Specific Selectors

**Lab Map:**
- Tree nodes: `.tree-node[data-slug='locations/freezer-minus80-a']`
- Node title (clickable): `.tree-node[data-slug='...'] > .tree-node-row .tw-title`
- Toggle expand: use `exec` (see pattern above)
- Search: `#treeSearch`
- Expand/Collapse all: `#expandAllBtn`, `#collapseAllBtn`

**Editor Modal (3-panel popup):**
- Overlay: `.em-overlay.open`
- Left panel (fields): `#em-col-fields`
- Center panel (content): `#em-col-body`
- Right panel (contents/grid): `#em-col-contents`
- Grid cells: `.em-grid-cell.occupied`, `.em-grid-cell.empty`
- Children list: `.em-child-row[data-slug='...']`
- Edit button: `#em-edit-toggle`
- Save button: `#em-save`
- Close button: `#em-cancel`

**Protocols page:**
- Protocol items: `.proto-item[data-path="wet-lab/quick-dna-extraction"]` — **NO .md extension**
- Rendered body: `#renderedDoc`
- Scroll container: `#protoMain`

**Notebooks page:**
- Direct URL: `notebooks.html?doc=notebooks/<folder>/<slug>` — NO `.md` extension
- Edit mode: use `exec` with `startEdit()` (not click)
- WYSIWYG surface: `.toastui-editor-ww-container .ProseMirror`

**Image annotation:**
- Open: double-click image with `dblclick: true`
- Canvas: `canvas`
- Place label: click canvas at `position: {x, y}`, type into `#annot-text`
- Save: `button:has-text("Save annotations")` — ALWAYS mock this route

## Commands

### Generate Video
```bash
cd /Users/greymonroe/Dropbox/myapps/webtutorial
node generate-tutorial.js examples/<config>.json examples/<output>.mp4
```

### Upload to YouTube
```bash
cd /Users/greymonroe/Dropbox/myapps/webtutorial
python3 youtube_upload.py examples/<output>.mp4 "Title" "Description" --json
```
Returns JSON with `video_id`, `url`, `embed_url`. Uploads as unlisted.
Auth token: `~/.grey-matter-credentials/youtube_token.json` (auto-refreshes).

### Add to Tutorials Page

Edit `/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/app/tutorials.html`:

```html
<div class="tutorial-card">
  <div class="video-wrap">
    <iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen loading="lazy"></iframe>
  </div>
  <div class="card-body">
    <div class="card-title">Title</div>
    <div class="card-desc">Description.</div>
    <div class="card-tags">
      <span class="card-tag">tag</span>
    </div>
  </div>
</div>
```

### Commit and Push
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
| Edge TTS binary | `/Users/greymonroe/Library/Python/3.9/bin/edge-tts` |
| Tutorials page | `/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/app/tutorials.html` |
| YouTube OAuth token | `~/.grey-matter-credentials/youtube_token.json` |
| Lab handbook repo | `monroe-lab/lab-handbook` on GitHub |
| LabBot (selector reference) | `/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/tests/labbot.mjs` |
| Voice pool | Ava (`en-US-AvaNeural`), Emma (`en-US-EmmaNeural`), Natasha (`en-AU-NatashaNeural`), Guy (`en-US-GuyNeural`) |
