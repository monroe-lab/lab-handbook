// Full-text ranked search (#188) — exercises app/js/search.js against the
// real generated docs/search-index.json in a vm sandbox with a stubbed fetch.
import { readFileSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const indexJson = readFileSync(path.join(root, 'docs/search-index.json'), 'utf8');
const searchSrc = readFileSync(path.join(root, 'app/js/search.js'), 'utf8');

const sandbox = {
  window: {},
  fetch: async () => ({ ok: true, json: async () => JSON.parse(indexJson) }),
  console,
};
sandbox.window.Lab = { BASE: '/' };
vm.createContext(sandbox);
vm.runInContext(searchSrc, sandbox);
const search = sandbox.window.Lab.search;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.error(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}

// 1. Body-only match: a term that appears in protocol text but not in any title
const bodyHits = await search.query('proteinase');
check('body-text match returns results', bodyHits.length > 0, 'no hits for "proteinase"');

// 2. Title match outranks body-only match
const pcr = await search.query('fiber-seq');
if (pcr.length) {
  const titleHit = pcr.findIndex(r => /fiber.?seq/i.test(r.title));
  check('title match ranks in top 3', titleHit >= 0 && titleHit < 3,
    `first title hit at rank ${titleHit}`);
} else {
  check('fiber-seq returns results', false);
}

// 3. Multi-word AND: both words required
const multi = await search.query('ethanol precipitation');
check('multi-word query returns results', multi.length > 0);
check('multi-word results scored', multi.every(r => r.score > 0));

// 4. Snippets present, escaped, and highlighted
const snip = multi.find(r => r.snippet);
check('snippet includes <mark>', !!snip && snip.snippet.includes('<mark>'));
check('snippet has no raw angle brackets from content',
  !multi.some(r => /<(?!\/?mark>)[a-z]/i.test(r.snippet || '')));

// 5. Nonsense query returns nothing
const junk = await search.query('zzqxjvvvw');
check('nonsense query returns empty', junk.length === 0);

// 6. paths restriction works
const restricted = await search.query('dna', { paths: ['wet-lab/extraction/hifi-dna-extraction'] });
check('paths restriction limits results', restricted.length <= 1);

// 7. Ranking is descending
const ranked = await search.query('extraction');
const desc = ranked.every((r, i) => i === 0 || ranked[i - 1].score >= r.score);
check('results sorted by score desc', desc);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
