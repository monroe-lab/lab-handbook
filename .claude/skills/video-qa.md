---
name: Video Tutorial QA
description: Reviews recorded handbook tutorial videos (webtutorial/examples/*.mp4), scoring each against its JSON config and flagging issues. Use this when the user asks to "review the tutorial videos", "score the tutorials", "check the videos", "continue the video qa loop", or similar.
---

## What this does

Iterates through `tests/video-qa-state.json`'s `queue[]`, picks the first `pending` video, extracts frames + audio + (optional) transcript, spawns a Claude agent that scores it 0–100 using the rubric in the state file, flags issues by severity, writes `tests/video-qa-reports/<slug>/report.{json,html}`, and commits + pushes. Runs until the queue is empty.

## Pre-flight (always run these before launching)

1. Confirm the loop isn't already running:
   ```
   ps aux | grep -E "video-qa-loop" | grep -v grep
   ```
2. Confirm ffmpeg is installed:
   ```
   which ffmpeg
   ```
3. Confirm the queue has pending work:
   ```
   /opt/homebrew/bin/python3.13 -c "import json; d=json.load(open('tests/video-qa-state.json')); p=[q for q in d['queue'] if q['status']=='pending']; print(f'{len(p)} pending')"
   ```

## Launch

```
nohup caffeinate -disu bash tests/video-qa-loop.sh > /dev/null 2>&1 &
disown
```

`nohup` + `& disown` is the pattern that survives Claude session exit. `caffeinate -disu` keeps the Mac awake (note: `-s` = PreventSystemSleep only holds on AC power — on battery, lid-close will still sleep).

## Monitor

```
tail -f tests/video-qa-loop.log
ls tests/video-qa-reports/
/opt/homebrew/bin/python3.13 -m json.tool tests/video-qa-state.json | head -40
```

## Each cycle produces

- `tests/video-qa-reports/<slug>/report.json` — structured scores + issue list
- `tests/video-qa-reports/<slug>/report.html` — single-page review UI
- A git commit `video-qa: reviewed <slug> — score <N>/100, ...`
- An updated `tests/video-qa-state.json` with the slug moved from `queue` → `reviewed`

## Scoring rubric summary

Max 100. Dimensions (weights): visual_clarity 20, narration_visual_sync 25, subtitle_legibility 10, pacing 15, cursor_guidance 10, correctness 15, polish 5.

Calibration: 90–100 ship as-is; 75–89 ship and file follow-ups; 60–74 edit/re-record 1–2 steps; <60 re-record from scratch.

## Adding more videos

Append new entries to `queue[]` in `tests/video-qa-state.json` with `{slug, title, status: "pending"}`. The loop picks them up automatically next cycle.

## Known limits

- Whisper transcript is optional — if `whisper` isn't on PATH, the agent scores from frames + config alone. Install locally with `pip install -U openai-whisper` for tighter narration/audio sync checks.
- 1 fps frame extraction is enough for pacing evaluation; bump to 2 fps in `video-qa-loop.sh` if you need finer temporal resolution.
- Loop does NOT run Playwright or hit the live site — this is video-file QA only. The live-site QA loop is separate (`tests/qa-loop.sh`).
