(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav hairline on scroll
  const nav = document.getElementById('nav');
  // Hero stack + statement words are scroll-linked
  const stack = document.querySelector('.stack');
  const statement = document.querySelector('[data-words]');
  let words = [];

  if (statement) {
    const text = statement.textContent.trim().replace(/\s+/g, ' ');
    statement.setAttribute('aria-label', text);
    statement.innerHTML = text.split(' ').map((w) => '<span class="w" aria-hidden="true">' + w + '</span>').join(' ');
    words = [...statement.querySelectorAll('.w')];
  }

  if (stack) setTimeout(() => stack.classList.add('is-live'), reduce ? 0 : 2100);

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    nav && nav.classList.toggle('is-scrolled', y > 8);

    if (reduce) return;

    if (stack && stack.classList.contains('is-live')) {
      const r = stack.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height) * 1.6 - 0.25));
      stack.style.setProperty('--p', p.toFixed(3));
    }

    if (words.length) {
      const r = statement.getBoundingClientRect();
      // Lights words as the paragraph travels from 85% to 35% of the viewport
      const start = vh * 0.85, end = vh * 0.35;
      const prog = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
      const lit = Math.round(prog * words.length);
      for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < lit);
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
  setTimeout(update, reduce ? 0 : 2150);

  // Reveal on scroll
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('shown'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('shown'));
  }

  // Waitlist form
  const form = document.getElementById('waitlist');
  if (!form) return;
  const field = form.querySelector('.field');
  const input = form.email;
  const btn = form.querySelector('.field__btn');
  const note = form.querySelector('.form__note');
  const defaultNote = note.textContent;
  const setNote = (msg, cls) => { note.textContent = msg; note.className = 'form__note' + (cls ? ' ' + cls : ''); };

  input.addEventListener('input', () => {
    if (field.classList.contains('is-error')) { field.classList.remove('is-error'); setNote(defaultNote); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      field.classList.add('is-error');
      setNote('Please enter a valid email address.', 'err');
      input.focus();
      return;
    }
    btn.disabled = true;
    setNote('Joining…');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company: form.company.value, source: location.search || 'direct' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      form.classList.add('is-done');
      input.blur();
      setNote(data.existing ? 'You’re already on the list. We’ll be in touch.' : 'You’re in. We’ll email you before launch.', 'ok');
    } catch (err) {
      btn.disabled = false;
      setNote(err.message, 'err');
    }
  });
})();
