// Test of all endpoints in the list. Saves only the shape of each response (without values).
// Usage: node --env-file=.env backend/test/end-points-initial-test.js
import { writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.GARMIN_PERSONAL_API_KEY;
const BASE = 'https://personal.connectapi.garmin.com';
if (!KEY) { console.error('Missing GARMIN_PERSONAL_API_KEY in .env'); process.exit(1); }

const fmt = d => d.toISOString().slice(0, 10);
const today = new Date();
const from = new Date(); from.setDate(today.getDate() - 7);
const D = {
  date: fmt(today), calendarDate: fmt(today), endDate: fmt(today), toDate: fmt(today), untilDate: fmt(today),
  startDate: fmt(from), fromDate: fmt(from),
};

// 1. Token
const tokRes = await fetch(`${BASE}/personalapitoken-service/personal-api/personal-api-key/token`,
  { method: 'POST', headers: { Authorization: `ApiKey ${KEY}` } });
const raw = (await tokRes.text()).trim();
let token = raw;
try { const j = JSON.parse(raw); token = j.access_token ?? j.accessToken ?? j.token ?? raw; } catch {}
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

async function call(path, query = {}) {
  const qs = new URLSearchParams(query).toString();
  const r = await fetch(BASE + path + (qs ? `?${qs}` : ''), { headers });
  const text = await r.text();
  let data = null; try { data = JSON.parse(text); } catch {}
  return { status: r.status, ct: r.headers.get('content-type') ?? '', size: text.length, data, text };
}

// Shape of a value: names and types, never values
function shape(v, depth = 0) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return v.length ? [`array(${v.length})`, shape(v[0], depth + 1)] : 'array(0)';
  if (typeof v === 'object') {
    if (depth > 3) return '{…}';
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x, depth + 1)]));
  }
  return typeof v;
}

// 2. A real activityId for endpoints that need it
const list = await call('/activitylist-service/activities/search/activities', { start: 0, limit: 5 });
const acts = Array.isArray(list.data) ? list.data : (list.data?.activities ?? []);
const activityId = acts[0]?.activityId ?? null;
console.log(`Test activityId: ${activityId ? 'found' : 'not found'}`);

// 3. Endpoints (path, query parameters, and whether they return binary data)
const ENDPOINTS = [
  // Activity
  { path: '/activity-service/activity/{activityId}', needsId: true },
  { path: '/activity-service/activity/{activityId}/workouts', needsId: true },
  { path: '/activitylist-service/activities/search/activities', query: { start: 0, limit: 5 } },
  { path: '/download-service/files/activity/{activityId}', needsId: true, binary: true },
  { path: '/wellnessactivity-service/activity/summary/range/{fromDate}/{untilDate}' },
  // Health
  { path: '/biometric-service/heartRateZones/v2' },
  { path: '/fitnessage-service/fitnessage/v2/{calendarDate}' },
  { path: '/goal-service/goal/user/effective/weightgoal/{startDate}/{endDate}' },
  { path: '/hrv-service/hrv/{calendarDate}' },
  { path: '/hrv-service/hrv/daily/{fromDate}/{toDate}' },
  { path: '/nutrition-service/food/logs/{date}' },
  { path: '/sleep-service/sleep/dailySleep', query: { date: D.date } },
  { path: '/sleep-service/sleep/dailySleepSummariesByDate', query: { date: D.date } },
  { path: '/usersummary-service/stats/hydration/daily/{startDate}/{endDate}' },
  { path: '/usersummary-service/stats/steps/daily/{startDate}/{endDate}' },
  { path: '/usersummary-service/stats/stress/daily/{startDate}/{endDate}' },
  { path: '/usersummary-service/usersummary/daily', query: { calendarDate: D.date } },
  { path: '/usersummary-service/v2/dailysummaries', query: { calendarDate: D.date } },
  { path: '/weight-service/weight/all/{startDate}/{endDate}' },
  { path: '/weight-service/weight/range/{startDate}/{endDate}' },
  { path: '/wellness-service/wellness/bodyBattery/reports/daily', query: { startDate: D.startDate, endDate: D.endDate } },
  { path: '/wellness-service/wellness/daily/spo2acclimation/{calendarDate}' },
  { path: '/wellness-service/wellness/dailyHeartRate', query: { date: D.date } },
  // Women's Health (remove them if you do not want them)
  { path: '/periodichealth-service/menstrualcycle/summary/{calendarDate}' },
  { path: '/periodichealth-service/menstrualcycle/dayview/{calendarDate}' },
  // User Profile
  { path: '/userprofile-service/userprofile/settings' },
];

const results = [];
for (const ep of ENDPOINTS) {
  const path = ep.path.replace(/\{(\w+)\}/g, (_, k) => (k === 'activityId' ? activityId ?? '' : D[k] ?? ''));
  if (ep.needsId && !activityId) { results.push({ path: ep.path, status: 'skipped (missing activityId)' }); continue; }
  const r = await call(path, ep.query ?? {});
  const row = { path, status: r.status, contentType: r.ct, size: r.size };
  if (ep.binary) row.shape = 'binary file (not saved)';
  else if (r.data !== null) row.shape = shape(r.data);
  else row.shape = 'not JSON';
  if (r.status >= 400) row.error = r.text.slice(0, 160); // the error usually names the correct parameter
  results.push(row);
  await new Promise(res => setTimeout(res, 300));
}

// 4. Console summary
for (const r of results) console.log(`${String(r.status).padEnd(8)} ${r.path}${r.error ? `\n         ${r.error}` : ''}`);

// 5. Save shapes (without values) in a file ignored by git
mkdirSync('backend/test/out', { recursive: true });
writeFileSync('scripts/test/out/shapes.json', JSON.stringify(results, null, 2));
console.log('\nShapes saved in scripts/test/out/shapes.json');
