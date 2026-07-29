/* One-shot importer: pushes a jobs export straight into Firebase.
 *
 * Loads the app's real js/store.js and js/data.js under Node with a stubbed
 * localStorage, so the payload it writes is byte-identical to what the browser
 * would have written.
 *
 *   node tools/import-to-firebase.mjs [path-to-export.json]
 *
 * Safe to re-run: jobs merge by id, so nothing is duplicated.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const NODE_URL = process.env.JOBS_NODE_URL
  || 'https://toefl-c71e5-default-rtdb.firebaseio.com/jobs/rasoulisaeid/data.json';
const SEED = process.argv[2] || path.join(ROOT, 'seed-jobs.json');

/* ---- run the browser modules under Node, over a fake localStorage --------- */

const cells = new Map();
const localStorage = {
  get length() { return cells.size; },
  key: (i) => [...cells.keys()][i],
  getItem: (k) => (cells.has(k) ? cells.get(k) : null),
  setItem: (k, v) => cells.set(k, String(v)),
  removeItem: (k) => cells.delete(k),
};

const sandbox = { console, crypto, TextEncoder, TextDecoder, btoa, atob, localStorage, alert: () => {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const file of ['js/store.js', 'js/data.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
}
const { Store, Data } = sandbox;

/* ------------------------------------------------------------------- main -- */

const die = (msg) => { console.error(`\n✗ ${msg}`); process.exit(1); };

if (!fs.existsSync(SEED)) die(`No export file at ${SEED}`);
const payload = JSON.parse(fs.readFileSync(SEED, 'utf8'));
if (!Array.isArray(payload.jobs)) die(`${SEED} has no "jobs" array.`);

console.log(`Export      : ${path.basename(SEED)} — ${payload.jobs.length} jobs`);
console.log(`Firebase    : ${NODE_URL}`);

// 1. Pull whatever is already up there, so we extend rather than clobber.
const existing = await fetch(NODE_URL).then((r) => r.json()).catch(() => null);
if (existing?.data) {
  Store.restore(JSON.parse(existing.data));
  console.log('Remote      : found existing data — merging into it');
} else {
  console.log('Remote      : empty — this will be the first write');
}

// 2. Import, then push the whole store up in sync.js's envelope.
await Data.load();
const result = await Data.importAll(payload);

const body = JSON.stringify({
  data: JSON.stringify(Store.dump()),
  updatedAt: Date.now(),
  clientId: 'import-' + Math.random().toString(36).slice(2),
});
const res = await fetch(NODE_URL, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body,
});
if (!res.ok) die(`Firebase rejected the write — HTTP ${res.status}`);

console.log(`\n✓ Imported ${result.added} job${result.added === 1 ? '' : 's'}` +
  (result.skipped ? `, skipped ${result.skipped} already present` : '') +
  ` — ${Data.listJobs().length} total.`);
console.log('  Open the site and they will be there.');
