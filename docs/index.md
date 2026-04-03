---
type: index
title: Monroe Lab Handbook
---

<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined">

<style>
.dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.dash-card { background: var(--md-code-bg-color, rgba(0,0,0,0.03)); border-radius: 12px; padding: 18px; }
.dash-card h3 { font-size: 14px; font-weight: 600; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
.dash-card h3 .material-icons-outlined { font-size: 18px; }
.dash-full { grid-column: 1 / -1; }
@media (max-width: 768px) { .dashboard { grid-template-columns: 1fr; } }
</style>

# Monroe Lab

<div id="graphStats" style="display:flex;flex-wrap:wrap;gap:8px;margin:16px 0;"></div>

<div class="dashboard">

<div class="dash-card">
<h3><span class="material-icons-outlined" style="color:#e65100;">warning</span> Alerts</h3>
<div id="alertsPanel" style="font-size:13px;color:#757575;">Loading...</div>
</div>

<div class="dash-card">
<h3><span class="material-icons-outlined" style="color:#1565c0;">calendar_month</span> Upcoming</h3>
<div id="calendarPreview" style="font-size:13px;color:#757575;">No calendar data available</div>
</div>

<div class="dash-card">
<h3><span class="material-icons-outlined" style="color:#009688;">update</span> Recent Updates</h3>
<div id="recentUpdates" style="font-size:13px;color:#757575;">Loading...</div>
</div>

<div class="dash-card">
<h3><span class="material-icons-outlined" style="color:#6a1b9a;">hub</span> Knowledge Graph</h3>
<div id="knowledgeGraph" style="width:100%;min-height:280px;border-radius:8px;overflow:hidden;"></div>
</div>

<div class="dash-card dash-full">
<h3><span class="material-icons-outlined" style="color:#795548;">assignment</span> Bulletin Board</h3>
<div id="bulletinBoard" style="font-size:13px;">
<div id="bulletinContent" style="color:#757575;">Loading...</div>
<div style="margin-top:12px;">
<a href="editor/?file=docs/bulletin.md" style="display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:6px;background:#009688;color:#fff;text-decoration:none;font-size:12px;font-weight:500;">
<span class="material-icons-outlined" style="font-size:14px;">edit</span> Edit Bulletin
</a>
</div>
</div>
</div>

</div>
