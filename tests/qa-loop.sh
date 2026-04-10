#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Autonomous QA Loop for Monroe Lab Handbook
#
#  Drives Claude Code to run persona-based Playwright tests,
#  evaluate screenshots, find bugs, write fixes, and iterate.
#
#  Usage:
#    nohup ./tests/qa-loop.sh &     # run overnight
#    tail -f tests/qa-loop.log      # monitor
#    touch tests/qa-pause           # gracefully pause
#    rm tests/qa-pause              # resume
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab"
SITE_URL="https://monroe-lab.github.io/lab-handbook"
STATE_FILE="tests/qa-state.json"
LOG_FILE="tests/qa-loop.log"
SCREENSHOT_DIR="/tmp/qa-screenshots"
MAX_CYCLES=30
PAUSE_FILE="tests/qa-pause"

cd "$PROJECT_DIR"
mkdir -p "$SCREENSHOT_DIR"

echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  QA Loop starting — $(date)" | tee -a "$LOG_FILE"
echo "  Site: $SITE_URL" | tee -a "$LOG_FILE"
echo "  Max cycles: $MAX_CYCLES" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

for i in $(seq 1 $MAX_CYCLES); do
  echo "" | tee -a "$LOG_FILE"
  echo "═══ Cycle $i / $MAX_CYCLES — $(date) ═══" | tee -a "$LOG_FILE"

  # Graceful pause
  if [ -f "$PAUSE_FILE" ]; then
    echo "  ⏸  Pause file found. Waiting..." | tee -a "$LOG_FILE"
    while [ -f "$PAUSE_FILE" ]; do sleep 10; done
    echo "  ▶  Resumed." | tee -a "$LOG_FILE"
  fi

  # Run one Claude Code QA cycle
  claude -p "$(cat <<'PROMPT'
You are an autonomous QA agent for the Monroe Lab Handbook web application.

## Context
- Live site: https://monroe-lab.github.io/lab-handbook
- Repo: monroe-lab/lab-handbook
- Auth: `gh auth token` injected via Playwright `context.addInitScript`
- State file: tests/qa-state.json (read it FIRST to understand progress)
- Screenshots go to: /tmp/qa-screenshots/
- Existing test patterns: read tests/labbot.mjs for Playwright auth setup and helpers

## Your task this cycle
1. Read tests/qa-state.json to see what phase you're in and what's been done
2. Pick a persona from the state file and simulate their realistic workflow
3. Write a focused Playwright script (save to /tmp/qa-cycle-{N}.mjs), run it
4. Take screenshots at EVERY step — view mode, edit mode, after save, after navigate
5. READ every screenshot with the Read tool and evaluate: Does it look right? Is content visible? Any stale views? Missing data? Broken layout?
6. Log bugs with descriptions and screenshot paths
7. If you find a bug you can fix: read the source, fix it, re-test
8. Update tests/qa-state.json with everything you did, found, and fixed
9. Git commit changes (NOT test artifacts) with message "qa-cycle-{N}: {summary}"

## Phases (advance as coverage grows)
- **exploration**: Spider all routes, take baseline screenshots, catalog pages
- **functional**: Test CRUD on every page as each persona, verify save/render
- **edge_cases**: Special chars, empty states, long content, mobile, rapid clicks
- **fixing**: Fix open bugs, re-test, mark resolved
- **polish**: UX improvements, consistency, accessibility
- **complete**: All clear, no new bugs found for 2 cycles

## Personas (simulate real users)
Each persona has different workflows. Test what THEY would do:
- Grad student: daily notebook entries, gel images, sample tracking, follows protocols
- Postdoc: creates protocols, manages inventory, edits wiki pages, project docs
- Undergrad: reads existing protocols, checks inventory, simple notebooks
- PI: dashboard review, bulletin board, checks on project status, reviews notebooks

## Rules
- NEVER modify: mkdocs.yml, .github/, requirements.txt, overrides/
- All file changes (fixes) go to app/ or docs/ only
- Take screenshots CONSTANTLY — they are your evidence
- READ screenshots and evaluate them — don't just take them blindly
- Be methodical: don't re-test what's already been tested
- If you find no new bugs for 2 cycles, set phase to "complete"
- Increment cycle counter in state file

## Key patterns from existing tests
```javascript
import { chromium } from 'playwright';
import { execSync } from 'child_process';
const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
// Auth setup:
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
```
PROMPT
  )" --dangerously-skip-permissions --allowedTools "Bash(timeout:300000),Edit,Write,Read,Glob,Grep" 2>&1 | tee -a "$LOG_FILE"

  # Health check — verify site is still up
  echo "  Health check..." | tee -a "$LOG_FILE"
  if ! curl -sf "$SITE_URL" > /dev/null 2>&1; then
    echo "  ⚠️  Site not responding (may be rebuilding). Waiting 60s..." | tee -a "$LOG_FILE"
    sleep 60
    if ! curl -sf "$SITE_URL" > /dev/null 2>&1; then
      echo "  ❌  Site still down. Reverting last commit." | tee -a "$LOG_FILE"
      git revert HEAD --no-edit 2>/dev/null || true
      git push 2>/dev/null || true
      echo "  Reverted. Stopping." | tee -a "$LOG_FILE"
      break
    fi
  fi
  echo "  ✅  Site healthy." | tee -a "$LOG_FILE"

  # Check if agent marked itself complete
  if grep -q '"phase": "complete"' "$STATE_FILE" 2>/dev/null; then
    echo "  🏁  Agent reports all phases complete at cycle $i" | tee -a "$LOG_FILE"
    break
  fi

  # Brief pause between cycles
  sleep 5
done

echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  QA Loop finished — $(date)" | tee -a "$LOG_FILE"
echo "  Review: cat tests/qa-state.json | python3 -m json.tool" | tee -a "$LOG_FILE"
echo "  Screenshots: ls /tmp/qa-screenshots/" | tee -a "$LOG_FILE"
echo "  Git log: git log --oneline -20" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
