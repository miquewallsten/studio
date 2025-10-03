const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;  // 1 minute
const MAX = 60;            // 60 req/min per key

function keyFrom(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'ip:local';
  const user = req.headers.get('authorization') ? 'auth' : 'anon';
  return `${ip}:${user}`;
}

export function checkRateLimit(req: Request) {
  const k = keyFrom(req);
  const now = Date.now();
  const rec = hits.get(k) || { count: 0, ts: now };
  if (now - rec.ts > WINDOW_MS) { rec.count = 0; rec.ts = now; }
  rec.count += 1;
  hits.set(k, rec);
  if (rec.count > MAX) throw new Error('Too many requests, slow down.');
}
