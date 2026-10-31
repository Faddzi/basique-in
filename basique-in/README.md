# basique.in

Coming soon page for **Basique**, premium everyday basics from India.

Static site on Cloudflare Pages, with a Pages Function (`functions/api/subscribe.js`) that stores waitlist emails in a KV namespace bound as `WAITLIST`.

- No build step. Build command: none. Output directory: `/`.
- Waitlist entries: Cloudflare dashboard → Storage & Databases → KV → `basique-waitlist` (keys `email:<address>`).
