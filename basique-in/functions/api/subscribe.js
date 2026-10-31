// Cloudflare Pages Function: POST /api/subscribe
// Requires a KV namespace bound as WAITLIST in the Pages project settings.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  if (!env.WAITLIST) return json({ ok: false, error: 'Waitlist is not configured yet.' }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }

  // Honeypot: bots fill hidden field. Pretend success.
  if (data.company) return json({ ok: true });

  const email = String(data.email || '').trim().toLowerCase().slice(0, 254);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);

  const key = `email:${email}`;
  if (await env.WAITLIST.get(key)) return json({ ok: true, existing: true });

  const record = {
    email,
    ts: new Date().toISOString(),
    country: request.cf?.country || null,
    city: request.cf?.city || null,
    source: String(data.source || '').slice(0, 200),
    ua: (request.headers.get('user-agent') || '').slice(0, 300),
  };
  await env.WAITLIST.put(key, JSON.stringify(record), { metadata: { ts: record.ts } });
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'Method not allowed' }, 405);
