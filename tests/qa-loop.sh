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
MAX_CYCLES=25
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

  # Run one Claude Code QA cycle. Prompt lives in tests/qa-prompt.md so bash doesn't
  # have to parse its body (apostrophes + backticks were breaking a nested heredoc).
  PROMPT_TEXT="$(cat tests/qa-prompt.md)"
  claude -p "$PROMPT_TEXT" --dangerously-skip-permissions --allowedTools "Bash(timeout:300000),Edit,Write,Read,Glob,Grep" 2>&1 | tee -a "$LOG_FILE" || echo "  ⚠️  Cycle $i claude call exited non-zero; continuing." | tee -a "$LOG_FILE"

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
