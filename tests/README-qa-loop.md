# QA Loop — Autonomous day-to-day workflow testing

Turns a persistent pool of personas, behavior modifiers, and scenario cards into an autonomous loop of Claude agents that exercise the live lab handbook, take heavy screenshots, evaluate them visually, and commit fixes.

## tl;dr

```bash
cd /Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab

# start (run via Claude's Bash tool with run_in_background: true)
bash tests/qa-loop.sh

# watch
tail -f tests/qa-loop.log
cat tests/qa-state.json | python3 -m json.tool

# stop
pkill -f qa-loop.sh
```

It resumes where it left off — no arguments needed. To tell Claude "keep going", say "continue the qa loop" in any future session; the playbook at `.claude/skills/qa-loop.md` has everything Claude needs.

## Files

| File | What |
|---|---|
| `tests/qa-loop.sh` | Shell orchestrator. Loops `MAX_CYCLES` (default 25) and spawns one Claude agent per cycle. |
| `tests/qa-prompt.md` | The prompt the agent receives each cycle. Focus + screenshot discipline. |
| `tests/qa-state.json` | Persistent state: personas, modifiers, scenario_cards, cycle counter, bugs_found, fixes_applied. |
| `tests/qa-loop.log` | Live output log. Rotate by renaming before launch. |
| `tests/qa-state.archive-*.json` | Archived prior-run histories. |
| `/tmp/qa-screenshots/cycleN/` | Screenshots + per-cycle `_log.json` written by each cycle's Playwright script. Not committed. |
| `/tmp/qa-cycle-N.mjs` | The Playwright script the agent wrote for cycle N. Not committed. |
| `.claude/skills/qa-loop.md` | Playbook Claude reads when you ask to resume/continue. |

## What each cycle does

1. Reads `qa-state.json`, picks a random persona × modifier × scenario combination not yet tried
2. Writes a Playwright script to `/tmp/qa-cycle-N.mjs`
3. Runs it headless against `https://monroe-lab.github.io/lab-handbook`
4. Takes 15–40 screenshots (before+after each meaningful action) into `/tmp/qa-screenshots/cycleN/`
5. Reads every screenshot with the Read tool and writes a visual evaluation
6. Logs functional AND cosmetic bugs; fixes what it can (edits under `app/` or `docs/` only)
7. Updates `qa-state.json`
8. Commits with `qa-cycle-N: <summary>` and pushes
9. Cleans up test artifacts it created on GitHub

Phases auto-advance: `exploration → functional → edge_cases → fixing → polish → complete`.

## Personas and scenarios (summary)

4 personas × 10 tasks each, 10 behavior modifiers, 18 multi-step scenario cards covering: aliquot day in a freezer box, ethanol bottle on a lab bench, new freezer box creation, inventory reorder toggling, photo-heavy notebook entries, print-protocol preview, rename + relink, equipment move between shelves, cross-page wikilink crawl, mobile notebook entry, bulk sample entry, waste container creation, etc.

The full lists live at the top of `tests/qa-state.json` — edit them there to shift focus.

## Pause / resume

```bash
touch tests/qa-pause    # graceful pause between cycles
rm tests/qa-pause       # resume
pkill -f qa-loop.sh     # hard stop
```

## ⚠️ Internet-loss footgun

If your internet drops mid-run, the loop's health check (`curl -sf $SITE_URL`) fails, it blames the last commit, and runs `git revert HEAD --no-edit` locally. The push fails silently (no internet), so the revert sits on your local `main` until you come back online.

**If you come back to a surprise `Revert "qa-cycle-N: …"` commit that never pushed**: `git reset --hard HEAD~1` to drop it before any future push.

**Preventive patch** (apply if you're starting a long run before a known offline window): edit `tests/qa-loop.sh`, and before the `git revert HEAD` line add:

```bash
if ! curl -sf https://api.github.com > /dev/null 2>&1; then
  echo "  Internet down, not site-specific. Pausing instead of reverting." | tee -a "$LOG_FILE"
  sleep 300
  continue
fi
```

## Reset to a fresh run

```bash
cp tests/qa-state.json tests/qa-state.archive-$(date +%Y-%m-%d).json
python3 -c "
import json
d = json.load(open('tests/qa-state.json'))
d.update({'phase':'exploration','cycle':0,'workflows_tested':[],'bugs_found':[],'fixes_applied':[],'improvements_proposed':[],'edge_cases_tested':[],'screenshots_taken':[]})
json.dump(d, open('tests/qa-state.json','w'), indent=2)
"
: > tests/qa-loop.log
```

## Related tools in `tests/`

- `labbot.mjs` — 248-test functional suite, run directly with `node tests/labbot.mjs --headed`. Complementary, not a replacement.
- `workflow-e2e.mjs` — single scripted end-to-end "day-in-the-life" (James Freckles) for quick regression.
- `fix-loop.sh` — parallel batch-mode agent runner for a predefined TODO list (different use case).
- `STATUS.md` — LabBot scores and development round log.
