#!/usr/bin/env python3
"""Check that every user-facing HTML page loads the issue reporter FAB.

The FAB (bottom-right 💡 button) is pulled in by `app/js/lab.js` — any page
that doesn't include lab.js (or issue-reporter.js directly) has no way for
the user to file bug/feedback reports from that page. Grey has repeatedly
asked that the FAB be on EVERY page, so this check runs in CI to prevent
regressions.

Pages exempted:
- `app/index.html` — redirect stub to dashboard
- `docs/calendar/index.html` — redirect stub
- `docs/notebook-app/index.html` — orphaned legacy page, no nav links

Exit 1 if any non-exempt page is missing the FAB.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
EXEMPT = {
    Path('app/index.html'),
    Path('docs/calendar/index.html'),
    Path('docs/notebook-app/index.html'),
}


def loads_fab(text: str) -> bool:
    # lab.js is the canonical loader (it appends issue-reporter.js).
    # Accept either lab.js or a direct issue-reporter.js include.
    return (
        'js/lab.js' in text
        or 'js/issue-reporter.js' in text
    )


def main() -> int:
    html_paths: list[Path] = []
    for root in ('app', 'docs'):
        for p in (REPO / root).rglob('*.html'):
            rel = p.relative_to(REPO)
            # Skip non-user-facing generated/archive dirs
            parts = rel.parts
            if '_supplemental' in parts or 'site' in parts:
                continue
            html_paths.append(rel)

    missing: list[Path] = []
    for rel in sorted(html_paths):
        if rel in EXEMPT:
            continue
        text = (REPO / rel).read_text(encoding='utf-8')
        # Redirect stubs (<meta http-equiv="refresh">) have no body — skip.
        if '<meta http-equiv="refresh"' in text and '</body>' not in text.lower():
            continue
        if not loads_fab(text):
            missing.append(rel)

    if missing:
        print('FAB check FAILED. The following pages do not load the issue reporter:')
        for p in missing:
            print(f'  - {p}')
        print()
        print('Fix: add `<script src="js/lab.js"></script>` (or the appropriate relative path)')
        print('to each page. The FAB is required on every user-facing page.')
        return 1

    print(f'FAB check passed ({len(html_paths) - len(EXEMPT)} pages).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
