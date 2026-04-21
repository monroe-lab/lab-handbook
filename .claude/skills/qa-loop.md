The user wants to run the autonomous QA loop against the Monroe Lab Handbook live site. This drives Claude agents in a batch to exercise day-to-day lab workflows, take heavy screenshots, evaluate them visually, find bugs, and commit fixes.

## When to invoke

Trigger phrases: "continue the qa loop", "run more tests", "keep testing", "resume QA testing", "continue where we left off on the lab handbook tests", "do another round of those scenario tests".

**Do not invoke this for**:
- LabBot (`node tests/labbot.mjs`) — that's the 248-test functional suite. Different tool, run it directly.
- One-off workflow tests — use `tests/workflow-e2e.mjs` instead.

## System overview

Three files, all inside `/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/tests/`:

| File | Role |
|---|---|
| `qa-loop.sh` | Shell orchestrator. Loops N cycles, each spawns one Claude agent. |
| `qa-prompt.md` | The prompt the agent gets each cycle. Screenshot discipline + day-to-day focus. |
| `qa-state.json` | Persistent state: personas, modifiers, scenario_cards, cycle counter, workflows_tested, bugs_found, fixes_applied. |

Per cycle the agent:
1. Reads `qa-state.json` and picks a random persona × modifier × scenario combination not yet tried
2. Writes a Playwright script at `/tmp/qa-cycle-N.mjs` and runs it headless
3. Takes 15–40 before+after screenshots into `/tmp/qa-screenshots/cycleN/`
4. Reads each screenshot with the Read tool and evaluates visually
5. Logs bugs (functional + cosmetic) and fixes what it can (edits under `app/` or `docs/`)
6. Updates `qa-state.json` and commits with `qa-cycle-N: <summary>`
7. Cleans up test artifacts on GitHub
8. Pushes

Phases auto-advance: `exploration → functional → edge_cases → fixing → polish → complete`.

## How to resume

**Pre-flight** (always check before launching):
```bash
cd /Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab
pgrep -fl "qa-loop.sh" && echo "ALREADY RUNNING — do not launch again"
git fetch origin && git status -sb
cat tests/qa-state.json | /opt/homebrew/bin/python3.13 -c "import json,sys; d=json.load(sys.stdin); print(f'phase:{d[\"phase\"]} cycle:{d[\"cycle\"]} workflows:{len(d[\"workflows_tested\"])} bugs_open:{sum(1 for b in d.get(\"bugs_found\",[]) if \"open\" in str(b).lower())}')"
```

**Resume**:
```bash
bash tests/qa-loop.sh    # Launch via the Bash tool with run_in_background:true
```

The script reads `qa-state.json` and picks up where it left off — it won't repeat persona+modifier+scenario combinations already in `workflows_tested`. `MAX_CYCLES=25` by default; edit the script to bump it.

**Always launch via `run_in_background: true`** — a foreground Bash tool call will SIGHUP the loop when the tool call finishes and kill it mid-cycle.

## How to monitor

```bash
tail -f tests/qa-loop.log                                  # live log
cat tests/qa-state.json | /opt/homebrew/bin/python3.13 -m json.tool | less
ls /tmp/qa-screenshots/                                    # cycle subdirs
git log --oneline -20 | grep qa-cycle                      # commits made
```

Set up a persistent Monitor watching `tail -F tests/qa-loop.log` with filter:
```
grep -E --line-buffered "⚠️|Site not responding|Site still down|Reverted|phase.*complete|Stopping|Error:|QA Loop finished"
```

## How to pause / stop

```bash
touch tests/qa-pause     # graceful pause between cycles
rm tests/qa-pause        # resume
pkill -f qa-loop.sh      # stop everything immediately
```

## ⚠️ Known footgun — internet loss

If Grey's local internet drops mid-cycle, the loop's health check fails, interprets it as "my last commit broke prod", and runs:
```bash
git revert HEAD --no-edit   # stays local (push fails with no internet)
break
```

If you come back online and see an unexpected `Revert "qa-cycle-N: ..."` commit locally before any pushes, run `git reset --hard HEAD~1` to drop it.

**Before launching a long run that might outlast internet**: consider patching `qa-loop.sh` to distinguish "internet down" from "site down" by first checking a stable external host:
```bash
# before the revert block, test general connectivity
if ! curl -sf https://api.github.com > /dev/null 2>&1; then
  echo "  Internet appears down, not site-specific. Pausing instead of reverting." | tee -a "$LOG_FILE"
  sleep 300
  continue
fi
```

## Reset / start fresh

If a run finished or the user wants to wipe history:
```bash
cp tests/qa-state.json tests/qa-state.archive-$(date +%Y-%m-%d).json
/opt/homebrew/bin/python3.13 -c "
import json
d = json.load(open('tests/qa-state.json'))
d['phase'] = 'exploration'
d['cycle'] = 0
d['workflows_tested'] = []
d['bugs_found'] = []
d['fixes_applied'] = []
d['improvements_proposed'] = []
d['edge_cases_tested'] = []
d['screenshots_taken'] = []
json.dump(d, open('tests/qa-state.json','w'), indent=2)
"
mv tests/qa-loop.log tests/qa-loop.archive-$(date +%Y-%m-%d).log 2>/dev/null; : > tests/qa-loop.log
```

## Expanding scenarios or personas

Edit `tests/qa-state.json` directly. Key arrays:
- `personas[]` — who's acting (4–10 objects with name, role, focus, tasks[])
- `behavior_modifiers[]` — how they act (rushed, careful, ui_critic, cross_linker, …)
- `scenario_cards[]` — full multi-step day-to-day flows (18+ currently)

The agent picks one of each per cycle and avoids repeats.

To change emphasis (e.g. shift from inventory to notebooks), edit `run_focus` at the top of `qa-state.json` and `## PRIMARY FOCUS THIS RUN` in `tests/qa-prompt.md`.

## Parallelism

The loop is serial — one cycle at a time. The complementary `tests/fix-loop.sh` can batch multiple agents in parallel worktrees if you have a defined TODO list to burn through. Different tool, different use case.

## Related artifacts

- `tests/labbot.mjs` — the functional test harness (248 tests). Complementary, not replacement.
- `tests/workflow-e2e.mjs` — a single scripted "day-in-the-life" run for regression testing.
- `tests/STATUS.md` — LabBot scores + development round log.
- `tests/qa-state.archive-*.json` — prior run histories. Useful for seeing what's been tried.
