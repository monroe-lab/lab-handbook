#!/usr/bin/env python3
"""
Walk the full git history and emit per-user activity stats to docs/user-stats.json.

Consumed by app/profile.html (R12 / Issue #42) to render personal dashboards
with activity counts and gamification badges.

Commits are grouped by an inferred GitHub login:
  - noreply emails in the form `ID+login@users.noreply.github.com` → `login`
  - all other emails fall back to a hand-maintained mapping in EMAIL_LOGIN_MAP
    (you will need to add entries here when new lab members start pushing)
  - anything unmatched is bucketed under the email local-part for visibility

Per user we track:
  - total_commits                 — all commits touching any file
  - first_commit / last_commit    — ISO dates (UTC, date only)
  - protocols_authored            — unique .md files under docs/wet-lab or
                                     docs/lab-safety created by this user
  - notebooks_authored            — unique .md files under docs/notebooks/
                                     created by this user
  - inventory_edits               — commits touching docs/resources,
                                     docs/stocks, or docs/inventory-app/inventory.json
  - wiki_edits                    — commits touching other docs/ files
  - images_uploaded               — unique files under docs/images created by
                                     this user
  - issue_attachments             — files created under issue-attachments/
  - lines_added / lines_removed   — total diff volume
  - recent_commits                — [{hash, subject, date}] for the 8 most recent

Runs `git log --name-status` once, parses the stream, and writes a single
JSON file. No external deps.

Usage:
  python3 scripts/build-user-stats.py

Integrate into your pipeline by calling this alongside build-object-index.py.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "docs" / "user-stats.json"

# For authors whose commit email isn't the GitHub noreply format, map them
# to their GitHub login here. Add entries when onboarding new lab members.
EMAIL_LOGIN_MAP = {
    "greymonroe@gmail.com": "greymonroe",
}

NOREPLY_RE = re.compile(r"^(\d+\+)?([a-zA-Z0-9][\w-]+)@users\.noreply\.github\.com$")


def infer_login(name: str, email: str) -> str:
    """Map a (name, email) pair to a GitHub login. Falls back to email
    local-part if we can't figure it out."""
    email_l = email.lower().strip()
    if email_l in EMAIL_LOGIN_MAP:
        return EMAIL_LOGIN_MAP[email_l]
    m = NOREPLY_RE.match(email_l)
    if m:
        return m.group(2)
    # Last resort: use the email local-part lowercased
    local = email_l.split("@", 1)[0]
    return local or name.lower().replace(" ", "-")


def classify_path(path: str) -> str:
    """Return a bucket label for a file path, or '' if we don't count it."""
    if path.startswith("docs/wet-lab/") or path.startswith("docs/lab-safety/"):
        return "protocol"
    if path.startswith("docs/notebooks/"):
        return "notebook"
    if path.startswith("docs/resources/") or path.startswith("docs/stocks/"):
        return "inventory"
    if path == "docs/inventory-app/inventory.json":
        return "inventory"
    if path.startswith("docs/images/"):
        return "image"
    if path.startswith("issue-attachments/"):
        return "issue_attachment"
    if path.startswith("docs/"):
        return "wiki"
    return ""


def run_git_log():
    """Yield (sha, author_name, author_email, timestamp, subject, files)."""
    # Walk oldest → newest so first-touch tracking works; --name-status gives
    # us per-file A/M/D/R status lines we can bucket. Use printable markers
    # since subprocess args can't contain null bytes.
    fmt = "<<<COMMIT>>>%H|||%an|||%ae|||%at|||%s"
    proc = subprocess.run(
        ["git", "log", "--reverse", "--name-status", "--no-merges",
         "--pretty=format:" + fmt, "--"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=120,
    )
    if proc.returncode != 0:
        print("git log failed:", proc.stderr, file=sys.stderr)
        sys.exit(1)
    out = proc.stdout

    cur = None
    files: list[tuple[str, str]] = []
    for line in out.splitlines():
        if line.startswith("<<<COMMIT>>>"):
            if cur is not None:
                yield (*cur, files)
            body = line[len("<<<COMMIT>>>"):]
            parts = body.split("|||", 4)
            # parts: sha, name, email, ts, subject
            sha = parts[0] if len(parts) > 0 else ""
            name = parts[1] if len(parts) > 1 else ""
            email = parts[2] if len(parts) > 2 else ""
            try:
                ts = int(parts[3]) if len(parts) > 3 else 0
            except ValueError:
                ts = 0
            subject = parts[4] if len(parts) > 4 else ""
            cur = (sha, name, email, ts, subject)
            files = []
        elif line.strip():
            # Status line: "M\tpath" or "A\tpath" or "R100\told\tnew"
            fields = line.split("\t")
            if len(fields) >= 2:
                status = fields[0][:1]  # A/M/D/R
                path = fields[-1]        # final name after rename
                files.append((status, path))
    if cur is not None:
        yield (*cur, files)


def lines_changed(sha: str) -> tuple[int, int]:
    """Return (added, removed) line count for a commit. Uses --numstat."""
    proc = subprocess.run(
        ["git", "show", "--numstat", "--no-renames", "--pretty=format:", sha],
        cwd=ROOT, capture_output=True, text=True,
    )
    added = removed = 0
    for line in proc.stdout.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        try:
            added += int(parts[0]) if parts[0].isdigit() else 0
            removed += int(parts[1]) if parts[1].isdigit() else 0
        except ValueError:
            pass
    return added, removed


def main():
    users: dict[str, dict] = {}
    # Track the first author that touched a given path so we can attribute
    # "authored" counts correctly (as opposed to edits).
    first_author: dict[str, str] = {}

    total_commits_seen = 0
    for sha, name, email, ts, subject, files in run_git_log():
        total_commits_seen += 1
        login = infer_login(name, email)
        u = users.setdefault(login, {
            "login": login,
            "display_name": name,
            "total_commits": 0,
            "first_commit": None,
            "last_commit": None,
            "protocols_authored": 0,
            "notebooks_authored": 0,
            "inventory_edits": 0,
            "wiki_edits": 0,
            "images_uploaded": 0,
            "issue_attachments": 0,
            "issues_filed": 0,       # populated via gh CLI after git walk
            "night_commits": 0,      # commits after 20:00 local
            "early_commits": 0,      # commits before 08:00 local
            "weekend_commits": 0,    # Saturday or Sunday
            "lines_added": 0,
            "lines_removed": 0,
            "recent_commits": [],
        })
        u["total_commits"] += 1
        date_iso = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")

        # Fun badge stats: time-of-day and day-of-week from commit timestamp
        commit_dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        hour = commit_dt.hour
        if hour >= 20 or hour < 5:
            u["night_commits"] += 1
        if hour < 8:
            u["early_commits"] += 1
        if commit_dt.weekday() >= 5:  # Saturday=5, Sunday=6
            u["weekend_commits"] += 1
        if u["first_commit"] is None:
            u["first_commit"] = date_iso
        u["last_commit"] = date_iso
        if not u["display_name"] and name:
            u["display_name"] = name

        # Bucket files. A file can only count toward "authored" once.
        for status, path in files:
            bucket = classify_path(path)
            if not bucket:
                continue
            is_new = status == "A"
            if bucket == "protocol":
                if is_new and path not in first_author:
                    first_author[path] = login
                    u["protocols_authored"] += 1
                # Every edit still counts as a wiki edit? No — protocols get
                # their own authored tally; edits don't inflate any counter
                # beyond total_commits.
            elif bucket == "notebook":
                if is_new and path not in first_author:
                    first_author[path] = login
                    u["notebooks_authored"] += 1
            elif bucket == "inventory":
                u["inventory_edits"] += 1
            elif bucket == "wiki":
                u["wiki_edits"] += 1
            elif bucket == "image":
                if is_new and path not in first_author:
                    first_author[path] = login
                    u["images_uploaded"] += 1
            elif bucket == "issue_attachment":
                u["issue_attachments"] += 1

        # Recent commits: keep the 8 most recent per user. We're walking
        # oldest → newest, so append and trim from the front.
        u["recent_commits"].append({
            "sha": sha[:7],
            "subject": subject[:120],
            "date": date_iso,
        })
        if len(u["recent_commits"]) > 8:
            u["recent_commits"] = u["recent_commits"][-8:]

    # Compute days_active for each user
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for login, u in users.items():
        if u["first_commit"]:
            d1 = datetime.strptime(u["first_commit"], "%Y-%m-%d")
            d2 = datetime.strptime(today, "%Y-%m-%d")
            u["days_active"] = (d2 - d1).days
        else:
            u["days_active"] = 0

    # Count issues filed per user via GitHub CLI. This is a small number
    # of API calls (one per unique git author) and gives us the "Bug Hunter"
    # badge category that counts issues filed, not just attachments uploaded.
    repo = "monroe-lab/lab-handbook"
    for login, u in users.items():
        try:
            result = subprocess.run(
                ["gh", "issue", "list", "--repo", repo, "--author", login,
                 "--state", "all", "--json", "number", "--jq", "length"],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode == 0:
                u["issues_filed"] = int(result.stdout.strip() or "0")
        except Exception:
            pass  # leave at 0

    # Sort users by total_commits desc for a stable output ordering.
    sorted_users = dict(sorted(
        users.items(),
        key=lambda kv: (-kv[1]["total_commits"], kv[0]),
    ))

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_commits": total_commits_seen,
        "users": sorted_users,
    }

    OUTPUT.write_text(json.dumps(payload, indent=2))
    print(f"Built user stats: {len(sorted_users)} users, {total_commits_seen} commits → {OUTPUT.relative_to(ROOT)}")
    for login, u in sorted_users.items():
        print(f"  {login}: commits={u['total_commits']} protocols={u['protocols_authored']} notebooks={u['notebooks_authored']} inventory={u['inventory_edits']}")


if __name__ == "__main__":
    main()
