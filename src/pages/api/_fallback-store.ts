import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), '.local_data', 'reports.json');

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readAll() {
  try {
    if (!fs.existsSync(DB_PATH)) return {} as Record<string, any>;
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.warn('[fallback-store] read error', err);
    return {} as Record<string, any>;
  }
}

export function writeAll(obj: Record<string, any>) {
  try {
    ensureDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn('[fallback-store] write error', err);
    return false;
  }
}

export function putReport(userUid: string, uin: string, data: any) {
  const db = readAll();
  if (!db.users) db.users = {};
  if (!db.users[userUid]) db.users[userUid] = { testReports: {} };
  db.users[userUid].testReports[uin] = Object.assign({}, db.users[userUid].testReports[uin] || {}, data);
  writeAll(db);
  return { path: `users/${userUid}/testReports/${uin}`, id: uin };
}

export function findByUin(uin: string) {
  const db = readAll();
  const users = db.users || {};
  for (const uid of Object.keys(users)) {
    const reports = (users[uid].testReports || {});
    if (reports[uin]) return { uid, path: `users/${uid}/testReports/${uin}`, data: reports[uin] };
  }
  return null;
}
