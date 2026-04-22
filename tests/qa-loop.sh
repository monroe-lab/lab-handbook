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
  # Per-cycle wall-clock: GNU coreutils `gtimeout` (brew install coreutils). Kills
  # the cycle and descendants after 25 min, exits 124. This is the battle-tested
  # equivalent of the Linux `timeout` command. Prior attempt using perl+alarm+exec
  # did not enforce because alarm timers reset across exec.
  CYCLE_TIMEOUT=1500
  /opt/homebrew/bin/gtimeout -k 30 "$CYCLE_TIMEOUT" \
    claude -p "$PROMPT_TEXT" --dangerously-skip-permissions --allowedTools "Bash(timeout:300000),Edit,Write,Read,Glob,Grep" 2>&1 | tee -a "$LOG_FILE"
  EXIT=${PIPESTATUS[0]}
  if [ "$EXIT" = "124" ] || [ "$EXIT" = "137" ]; then
    echo "  ⏱  Cycle $i hit ${CYCLE_TIMEOUT}s wall-clock timeout (exit=$EXIT); continuing." | tee -a "$LOG_FILE"
  elif [ "$EXIT" != "0" ]; then
    echo "  ⚠️  Cycle $i claude call exited non-zero (exit=$EXIT); continuing." | tee -a "$LOG_FILE"
  fi

  # Health check — verify site is still up. First confirm we actually have
  # internet by hitting api.github.com; if THAT fails the laptop is offline,
  # not the site, so we skip health enforcement (and the revert) and wait
  # for the connection to come back. This prevents the "wandering laptop"
  # footgun where losing wifi made us revert a perfectly good commit.
  echo "  Health check..." | tee -a "$LOG_FILE"
  if ! curl -sf -m 10 https://api.github.com > /dev/null 2>&1; then
    echo "  📶  No internet (api.github.com unreachable). Waiting for network..." | tee -a "$LOG_FILE"
    # Wait up to 30 min for connection; otherwise skip this cycle's health check.
    for _ in $(seq 1 180); do
      sleep 10
      if curl -sf -m 10 https://api.github.com > /dev/null 2>&1; then
        echo "  📶  Network restored." | tee -a "$LOG_FILE"
        break
      fi
    done
    if ! curl -sf -m 10 https://api.github.com > /dev/null 2>&1; then
      echo "  📶  Still offline after 30 min. Skipping site health check for this cycle (no revert)." | tee -a "$LOG_FILE"
      sleep 5
      continue
    fi
  fi
  # Only now — with confirmed internet — test the actual site.
  if ! curl -sf -m 15 "$SITE_URL" > /dev/null 2>&1; then
    echo "  ⚠️  Site not responding (may be rebuilding). Waiting 60s..." | tee -a "$LOG_FILE"
    sleep 60
    if ! curl -sf -m 15 "$SITE_URL" > /dev/null 2>&1; then
      echo "  ❌  Site still down while internet is up. Reverting last commit." | tee -a "$LOG_FILE"
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
