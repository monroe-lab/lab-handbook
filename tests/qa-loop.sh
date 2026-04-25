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

# Pin absolute paths so a stripped PATH (nohup, launchd, cron, brew relink mid-run)
# can never make us fail the cycle with `gtimeout: failed to run command 'claude'`.
# Prior bug: 9 cycles in a row burned in seconds when /opt/homebrew/bin briefly
# fell off PATH during a brew autoupdate.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
CLAUDE_BIN="/opt/homebrew/bin/claude"
GTIMEOUT_BIN="/opt/homebrew/bin/gtimeout"
PYTHON_BIN="/opt/homebrew/bin/python3.13"

cd "$PROJECT_DIR"
mkdir -p "$SCREENSHOT_DIR"

# Pre-flight: fail fast and loudly if any required binary is missing, instead of
# entering the cycle loop and producing 25 useless "command not found" lines.
for bin in "$CLAUDE_BIN" "$GTIMEOUT_BIN" "$PYTHON_BIN"; do
  if [ ! -x "$bin" ]; then
    echo "❌ Required binary not executable: $bin" | tee -a "$LOG_FILE"
    echo "   Install with: brew install $(basename "$bin" | sed 's/3\.13$/@3.13/')" | tee -a "$LOG_FILE"
    exit 1
  fi
done

# Read qa-state cycle for log accounting (real progress counter, persists across relaunches).
qa_state_cycle() {
  "$PYTHON_BIN" -c "import json; print(json.load(open('$STATE_FILE'))['cycle'])" 2>/dev/null || echo "?"
}

START_QA_CYCLE=$(qa_state_cycle)

echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  QA Loop starting — $(date)" | tee -a "$LOG_FILE"
echo "  Site: $SITE_URL" | tee -a "$LOG_FILE"
echo "  Max iterations this run: $MAX_CYCLES (qa-state cycle starts at $START_QA_CYCLE)" | tee -a "$LOG_FILE"
echo "  Claude:  $CLAUDE_BIN ($("$CLAUDE_BIN" --version 2>&1 | head -1))" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# Counters for circuit breaker. Reset on any cycle that produces a commit.
fast_fail_streak=0
stall_streak=0
prev_head_sha="$(git rev-parse HEAD 2>/dev/null || echo none)"

for i in $(seq 1 $MAX_CYCLES); do
  qa_cycle="$(qa_state_cycle)"
  echo "" | tee -a "$LOG_FILE"
  echo "═══ Iter $i/$MAX_CYCLES (qa-state cycle $qa_cycle) — $(date) ═══" | tee -a "$LOG_FILE"

  # Graceful pause
  if [ -f "$PAUSE_FILE" ]; then
    echo "  ⏸  Pause file found. Waiting..." | tee -a "$LOG_FILE"
    while [ -f "$PAUSE_FILE" ]; do sleep 10; done
    echo "  ▶  Resumed." | tee -a "$LOG_FILE"
  fi

  # Per-cycle wall-clock: GNU coreutils `gtimeout` (brew install coreutils). Kills
  # the cycle and descendants after 25 min, exits 124. This is the battle-tested
  # equivalent of the Linux `timeout` command. Prior attempt using perl+alarm+exec
  # did not enforce because alarm timers reset across exec.
  CYCLE_TIMEOUT=1500
  PROMPT_TEXT="$(cat tests/qa-prompt.md)"
  cycle_start=$(date +%s)

  # `set +e` around the claude call so `set -e` + `pipefail` doesn't kill the
  # loop when the inner claude or gtimeout exits non-zero (cycle timeout=124,
  # API error=1, exec-fail=127, etc.). Earlier we used `... | tee ... || true`
  # but `||` runs `true` as a subsequent pipeline that resets PIPESTATUS to (0),
  # so the EXIT capture was *always* 0 and fast-fail detection silently never
  # fired. Spotted when a homebrew claude relink mid-cycle produced "exit=0"
  # for a 0-second cycle that had logged "gtimeout: No such file or directory".
  set +e
  "$GTIMEOUT_BIN" -k 30 "$CYCLE_TIMEOUT" \
    "$CLAUDE_BIN" -p "$PROMPT_TEXT" --dangerously-skip-permissions --allowedTools "Bash(timeout:300000),Edit,Write,Read,Glob,Grep" 2>&1 | tee -a "$LOG_FILE"
  EXIT=${PIPESTATUS[0]}
  set -e
  cycle_end=$(date +%s)
  elapsed=$(( cycle_end - cycle_start ))

  # Did this cycle produce a new commit? Source of truth for "made progress".
  new_head_sha="$(git rev-parse HEAD 2>/dev/null || echo none)"
  new_qa_cycle="$(qa_state_cycle)"
  made_commit="no"; [ "$new_head_sha" != "$prev_head_sha" ] && made_commit="yes"
  qa_advanced="no"; [ "$new_qa_cycle" != "$qa_cycle" ] && qa_advanced="yes"

  # Structured one-line summary every cycle — easy to grep for monitoring.
  printf '  ⟶  iter=%s exit=%s elapsed=%ss commit=%s qa_cycle=%s→%s fast_streak=%s stall_streak=%s\n' \
    "$i" "$EXIT" "$elapsed" "$made_commit" "$qa_cycle" "$new_qa_cycle" \
    "$fast_fail_streak" "$stall_streak" | tee -a "$LOG_FILE"

  # ── Failure classification ────────────────────────────────────────────────
  # Fast-fail: cycle exited non-zero in under 60s. Almost always a transient
  # infra problem (PATH dropped claude, instant API auth error, network blip).
  # Burning the next iter immediately would just hit the same wall.
  if [ "$EXIT" != "0" ] && [ "$elapsed" -lt 60 ]; then
    fast_fail_streak=$(( fast_fail_streak + 1 ))
    backoff=$(( 600 * fast_fail_streak ))
    [ "$backoff" -gt 1800 ] && backoff=1800
    echo "  ⚠️  Fast-fail #$fast_fail_streak (exit=$EXIT, elapsed=${elapsed}s). Backing off ${backoff}s." | tee -a "$LOG_FILE"
    if [ "$fast_fail_streak" -ge 3 ]; then
      echo "  🛑 Circuit breaker: 3 consecutive fast-fails. Aborting loop." | tee -a "$LOG_FILE"
      echo "     Inspect: tail tests/qa-loop.log; which claude; gh auth status" | tee -a "$LOG_FILE"
      break
    fi
    sleep "$backoff"
    continue
  fi

  # Slow-fail / stall: cycle ran a meaningful duration but produced no commit
  # AND didn't advance the qa-state cycle counter. This catches the "API
  # stream idle timeout after 20 min of partial output" case where the agent
  # spins inside gtimeout but never lands work.
  if [ "$made_commit" = "no" ] && [ "$qa_advanced" = "no" ]; then
    stall_streak=$(( stall_streak + 1 ))
    echo "  ⚠️  Stall #$stall_streak (no commit, qa-state cycle unchanged at $new_qa_cycle)." | tee -a "$LOG_FILE"
    if [ "$stall_streak" -ge 2 ]; then
      echo "  🛑 Circuit breaker: 2 consecutive stalls. Aborting loop." | tee -a "$LOG_FILE"
      break
    fi
  else
    # Real progress this cycle. Reset both counters.
    fast_fail_streak=0
    stall_streak=0
  fi

  if [ "$EXIT" = "124" ] || [ "$EXIT" = "137" ]; then
    echo "  ⏱  Iter $i hit ${CYCLE_TIMEOUT}s wall-clock timeout (exit=$EXIT); continuing." | tee -a "$LOG_FILE"
  elif [ "$EXIT" != "0" ]; then
    echo "  ⚠️  Iter $i claude call exited non-zero (exit=$EXIT, elapsed=${elapsed}s); continuing." | tee -a "$LOG_FILE"
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
      echo "  📶  Still offline after 30 min. Skipping site health check for this iter (no revert)." | tee -a "$LOG_FILE"
      sleep 5
      prev_head_sha="$new_head_sha"
      continue
    fi
  fi
  # Only now — with confirmed internet — test the actual site.
  if ! curl -sf -m 30 "$SITE_URL" > /dev/null 2>&1; then
    echo "  ⚠️  Site not responding (may be rebuilding). Waiting 60s..." | tee -a "$LOG_FILE"
    sleep 60
    if ! curl -sf -m 30 "$SITE_URL" > /dev/null 2>&1; then
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
    echo "  🏁  Agent reports all phases complete at iter $i (qa-state cycle $new_qa_cycle)" | tee -a "$LOG_FILE"
    break
  fi

  # Roll head SHA forward for next iter's diff-vs-prev detection.
  prev_head_sha="$new_head_sha"

  # Brief pause between cycles
  sleep 5
done

echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  QA Loop finished — $(date)" | tee -a "$LOG_FILE"
echo "  qa-state cycle: $START_QA_CYCLE → $(qa_state_cycle)" | tee -a "$LOG_FILE"
echo "  Review: cat tests/qa-state.json | $PYTHON_BIN -m json.tool" | tee -a "$LOG_FILE"
echo "  Screenshots: ls /tmp/qa-screenshots/" | tee -a "$LOG_FILE"
echo "  Git log: git log --oneline -20" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
