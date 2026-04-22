#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Video Tutorial QA Loop
#
#  Picks the next pending video from tests/video-qa-state.json,
#  extracts frames + audio + (optional) transcript, spawns a
#  Claude agent to score the video against its config. Commits
#  the report and continues until the queue is empty.
#
#  Usage:
#    nohup caffeinate -disu bash tests/video-qa-loop.sh > /dev/null 2>&1 & disown
#    tail -f tests/video-qa-loop.log
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab"
STATE_FILE="tests/video-qa-state.json"
LOG_FILE="tests/video-qa-loop.log"
FRAMES_BASE="/tmp/video-qa"
MAX_CYCLES=20
PAUSE_FILE="tests/video-qa-pause"

# Video-generator directory (configs + mp4s live here, NOT in the lab repo).
VIDEOS_DIR="/Users/greymonroe/Dropbox/myapps/webtutorial/examples"

PY="/opt/homebrew/bin/python3.13"

cd "$PROJECT_DIR"
mkdir -p "$FRAMES_BASE" tests/video-qa-reports

echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  Video QA Loop — $(date)" | tee -a "$LOG_FILE"
echo "  Videos dir: $VIDEOS_DIR" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# Optional tools — detect once, skip cleanly if missing
HAVE_WHISPER=0
if command -v whisper > /dev/null 2>&1; then
  HAVE_WHISPER=1
  echo "  ✅ whisper found — transcripts will be generated" | tee -a "$LOG_FILE"
else
  echo "  ℹ️  whisper not installed — agent will rely on frames + config only" | tee -a "$LOG_FILE"
fi

if ! command -v ffmpeg > /dev/null 2>&1; then
  echo "  ❌ ffmpeg not found. Install with: brew install ffmpeg" | tee -a "$LOG_FILE"
  exit 1
fi

for i in $(seq 1 $MAX_CYCLES); do
  echo "" | tee -a "$LOG_FILE"
  echo "═══ Cycle $i / $MAX_CYCLES — $(date) ═══" | tee -a "$LOG_FILE"

  if [ -f "$PAUSE_FILE" ]; then
    echo "  ⏸  Pause file found. Waiting..." | tee -a "$LOG_FILE"
    while [ -f "$PAUSE_FILE" ]; do sleep 10; done
  fi

  # Pick the next pending video.
  SLUG=$("$PY" - <<'PYEOF'
import json, sys
d = json.load(open('tests/video-qa-state.json'))
pending = [q for q in d.get('queue', []) if q.get('status') == 'pending']
if not pending:
    print("", end="")
else:
    print(pending[0]['slug'], end="")
PYEOF
)

  if [ -z "$SLUG" ]; then
    echo "  🏁  Queue empty — nothing left to review." | tee -a "$LOG_FILE"
    break
  fi

  MP4="$VIDEOS_DIR/$SLUG.mp4"
  CONFIG="$VIDEOS_DIR/$SLUG.json"

  if [ ! -f "$MP4" ] || [ ! -f "$CONFIG" ]; then
    echo "  ⚠️  Missing $MP4 or $CONFIG — marking skipped and continuing" | tee -a "$LOG_FILE"
    "$PY" - "$SLUG" <<'PYEOF'
import json, sys
slug = sys.argv[1]
with open('tests/video-qa-state.json') as f: d = json.load(f)
for q in d.get('queue', []):
    if q.get('slug') == slug:
        q['status'] = 'skipped'
        q['skip_reason'] = 'missing mp4 or config'
with open('tests/video-qa-state.json', 'w') as f:
    json.dump(d, f, indent=2)
PYEOF
    continue
  fi

  WORK="$FRAMES_BASE/$SLUG"
  mkdir -p "$WORK/frames"

  echo "  🎬  Reviewing: $SLUG" | tee -a "$LOG_FILE"

  # 1. Extract frames at 1 fps (skip if already done).
  if [ ! "$(ls -A "$WORK/frames" 2>/dev/null)" ]; then
    echo "  📸  Extracting frames at 1 fps → $WORK/frames/" | tee -a "$LOG_FILE"
    ffmpeg -hide_banner -loglevel error -i "$MP4" -vf fps=1 "$WORK/frames/%06d.jpg"
  fi
  FRAME_COUNT=$(ls "$WORK/frames" | wc -l | tr -d ' ')
  echo "  📸  $FRAME_COUNT frames ready" | tee -a "$LOG_FILE"

  # 2. Extract audio (skip if done).
  if [ ! -f "$WORK/audio.wav" ]; then
    ffmpeg -hide_banner -loglevel error -i "$MP4" -vn -ac 1 -ar 16000 "$WORK/audio.wav" 2>/dev/null || true
  fi

  # 3. Run Whisper if available and transcript not yet cached.
  if [ "$HAVE_WHISPER" = "1" ] && [ ! -f "$WORK/transcript.json" ] && [ -f "$WORK/audio.wav" ]; then
    echo "  🗣️   Whisper transcribing (this can take a minute)..." | tee -a "$LOG_FILE"
    whisper "$WORK/audio.wav" --model small --output_format json --output_dir "$WORK" --fp16 False > /dev/null 2>&1 || true
    [ -f "$WORK/audio.json" ] && mv "$WORK/audio.json" "$WORK/transcript.json"
  fi

  # 4. Spawn Claude agent — 20 min wall clock.
  CYCLE_TIMEOUT=1200
  PROMPT_TEXT="$(cat tests/video-qa-prompt.md)"$'\n\n'"Current video slug: $SLUG"$'\n'"Frames dir: $WORK/frames"$'\n'"Audio path: $WORK/audio.wav"$'\n'"Transcript path: $WORK/transcript.json (if present)"

  /opt/homebrew/bin/gtimeout -k 30 "$CYCLE_TIMEOUT" \
    claude -p "$PROMPT_TEXT" --dangerously-skip-permissions \
      --allowedTools "Bash(timeout:180000),Edit,Write,Read,Glob,Grep" 2>&1 | tee -a "$LOG_FILE"
  EXIT=${PIPESTATUS[0]}

  if [ "$EXIT" = "124" ] || [ "$EXIT" = "137" ]; then
    echo "  ⏱  Cycle $i hit ${CYCLE_TIMEOUT}s timeout (exit=$EXIT); continuing." | tee -a "$LOG_FILE"
  elif [ "$EXIT" != "0" ]; then
    echo "  ⚠️  Cycle $i claude exited $EXIT; continuing." | tee -a "$LOG_FILE"
  fi

  # Brief pause so tee can flush + git push can land.
  sleep 5
done

echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  Video QA Loop finished — $(date)" | tee -a "$LOG_FILE"
echo "  Reports: ls tests/video-qa-reports/" | tee -a "$LOG_FILE"
echo "  Summary: cat tests/video-qa-state.json | $PY -m json.tool | head -60" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
