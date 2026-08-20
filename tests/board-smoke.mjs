// Smoke test for the Kanban task board (app/board.html).
// Hits the deployed site, authenticates, verifies: columns render, the
// welcome task shows in To do, quick-add creates a task, drag-and-drop
// moves it to In progress (frontmatter status persisted), then cleans up.
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const STAMP = Date.now().toString(36);
const TEST_TITLE = `smoke test task ${STAMP}`;
const TEST_SLUG = `smoke-test-task-${STAMP}`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.addInitScript(([tok]) => {
  try {
    localStorage.setItem('gh_lab_token', tok);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe' }));
    sessionStorage.setItem('monroe-lab-auth', 'true');
  } catch (e) {}
}, [token]);
const page = await context.newPage();
const fails = [];

async function check(label, fn) {
  try {
    await fn();
    console.log('PASS', label);
  } catch (e) {
    fails.push({ label, err: e.message });
    console.log('FAIL', label, '—', e.message);
  }
}

await check('board renders 3 columns', async () => {
  await page.goto(`${BASE}/app/board.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.board-col', { timeout: 15000 });
  const cols = await page.$$eval('.board-col', els => els.map(e => e.dataset.status));
  if (cols.join(',') !== 'todo,in_progress,done') throw new Error(`columns: ${cols.join(',')}`);
});

await check('welcome task visible in To do', async () => {
  const found = await page.$$eval('.board-col[data-status="todo"] .task-card .tc-title',
    els => els.some(e => e.textContent.includes('Welcome to the task board')));
  if (!found) throw new Error('welcome card not in todo column');
});

await check('nav has Board tab', async () => {
  const has = await page.$$eval('#lab-nav a', els => els.some(a => a.textContent.includes('Board')));
  if (!has) throw new Error('no Board tab in nav');
});

await check('quick-add creates a task', async () => {
  const input = await page.$('.board-col[data-status="todo"] .board-quickadd input');
  await input.fill(TEST_TITLE);
  await input.press('Enter');
  await page.waitForFunction((title) =>
    [...document.querySelectorAll('.board-col[data-status="todo"] .tc-title')]
      .some(e => e.textContent === title), TEST_TITLE, { timeout: 10000 });
  // Confirm the file actually lands in the repo (create commit is async — retry)
  let created = false;
  for (let i = 0; i < 10 && !created; i++) {
    await new Promise(r => setTimeout(r, 1500));
    try {
      execSync(`gh api repos/${REPO}/contents/docs/tasks/${TEST_SLUG}.md --jq .sha`, { encoding: 'utf8', stdio: 'pipe' });
      created = true;
    } catch (e) { /* not yet */ }
  }
  if (!created) throw new Error('task file never appeared in repo');
});

await check('drag to In progress persists status', async () => {
  await page.dragAndDrop(
    `.board-col[data-status="todo"] .task-card:has-text("${TEST_TITLE}")`,
    '.board-col[data-status="in_progress"] .board-cards');
  await page.waitForFunction((title) =>
    [...document.querySelectorAll('.board-col[data-status="in_progress"] .tc-title')]
      .some(e => e.textContent === title), TEST_TITLE, { timeout: 15000 });
  // Verify frontmatter on GitHub says in_progress (retry — commit is async)
  let ok = false;
  for (let i = 0; i < 10 && !ok; i++) {
    await new Promise(r => setTimeout(r, 1500));
    try {
      const raw = execSync(
        `gh api repos/${REPO}/contents/docs/tasks/${TEST_SLUG}.md --jq .content | base64 -d`,
        { encoding: 'utf8', stdio: 'pipe' });
      ok = /status:\s*in_progress/.test(raw);
    } catch (e) { /* not yet */ }
  }
  if (!ok) throw new Error('status not persisted to frontmatter');
});

// Cleanup: delete the smoke-test task file
try {
  const sha = execSync(`gh api repos/${REPO}/contents/docs/tasks/${TEST_SLUG}.md --jq .sha`, { encoding: 'utf8' }).trim();
  execSync(`gh api -X DELETE repos/${REPO}/contents/docs/tasks/${TEST_SLUG}.md -f message="board-smoke: cleanup" -f sha=${sha}`, { encoding: 'utf8' });
  console.log('cleanup: deleted test task');
} catch (e) {
  console.log('cleanup FAILED (delete docs/tasks/' + TEST_SLUG + '.md manually):', e.message);
}

await browser.close();
if (fails.length) {
  console.log(`\n${fails.length} FAILURE(S)`);
  process.exit(1);
}
console.log('\nAll board smoke checks passed.');
