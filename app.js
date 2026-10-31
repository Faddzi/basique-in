(() => {
  document.documentElement.classList.add('js');
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  setTimeout(() => {
    document.querySelector('.curtain')?.remove();
    document.body.classList.remove('is-loading');
  }, reduce ? 0 : 1600);

  const wm = document.querySelector('.wordmark');
  const chars = wm ? [...wm.querySelectorAll('.ch')] : [];
  setTimeout(() => wm && wm.classList.add('is-ready'), reduce ? 0 : 3300);

  if (!reduce && window.matchMedia('(hover: hover)').matches && wm) {
    let raf = 0;
    window.addEventListener('pointermove', (e) => {
      if (!wm.classList.contains('is-ready')) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        chars.forEach((c) => {
          const r = c.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const d = Math.hypot(e.clientX - cx, (e.clientY - cy) * 1.4);
          const w = Math.max(70, Math.min(125, 125 - d / 6));
          c.style.setProperty('--w', w.toFixed(1));
        });
      });
    });
    wm.closest('.hero').addEventListener('pointerleave', () => chars.forEach((c) => c.style.setProperty('--w', 100)));
  }

  const els = document.querySelectorAll('.in-view');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('shown'); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('shown'));
  }

  const form = document.getElementById('waitlist');
  if (!form) return;
  const note = form.querySelector('.waitlist__note');
  const btn = form.querySelector('button');
  const label = btn.querySelector('.btn__label');
  const setNote = (msg, cls) => { note.textContent = msg; note.className = 'waitlist__note ' + (cls || ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setNote('Please enter a valid email address.', 'err'); form.email.focus(); return; }
    btn.disabled = true; label.textContent = 'Joining…';
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company: form.company.value, source: location.search || 'direct' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong');
      form.classList.add('done');
      label.textContent = 'You’re in';
      form.email.value = '';
      setNote(data.existing ? 'You’re already on the list. We’ll be in touch.' : 'Welcome to Basique. You’ll hear from us first.', 'ok');
    } catch (err) {
      btn.disabled = false; label.textContent = 'Join the waitlist';
      setNote(err.message || 'Something went wrong. Please try again.', 'err');
    }
  });
})();
