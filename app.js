(() => {
  document.documentElement.classList.add('js');
  document.querySelectorAll('.year').forEach((el) => { el.textContent = new Date().getFullYear(); });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  setTimeout(() => {
    const curtain = document.querySelector('.curtain');
    if (curtain) curtain.remove();
    document.body.classList.remove('is-loading');
  }, reduce ? 0 : 1600);

  const header = document.getElementById('header');
  const onScroll = () => { if (header) header.classList.toggle('is-stuck', header.getBoundingClientRect().top <= 0 && window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const wordmark = document.querySelector('.wordmark');
  const letters = wordmark ? Array.from(wordmark.querySelectorAll('.ch')) : [];
  setTimeout(() => { if (wordmark) wordmark.classList.add('is-ready'); }, reduce ? 0 : 3300);

  if (!reduce && wordmark && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let frame = 0;
    window.addEventListener('pointermove', (e) => {
      if (!wordmark.classList.contains('is-ready')) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        letters.forEach((letter) => {
          const r = letter.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), (e.clientY - (r.top + r.height / 2)) * 1.4);
          letter.style.setProperty('--w', Math.max(70, Math.min(125, 125 - d / 6)).toFixed(1));
        });
      });
    });
    wordmark.closest('.hero').addEventListener('pointerleave', () => letters.forEach((letter) => letter.style.setProperty('--w', 100)));
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('shown'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('shown'));
  }

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  document.querySelectorAll('.signup').forEach((form) => {
    const input = form.querySelector('input[type=email]');
    const button = form.querySelector('button');
    const label = form.querySelector('.signup__label');
    const note = form.querySelector('.signup__note');
    const defaultNote = note.textContent;
    const setNote = (msg, cls) => { note.textContent = msg; note.className = 'signup__note' + (cls ? ' ' + cls : ''); };

    input.addEventListener('input', () => {
      if (form.classList.contains('is-error')) { form.classList.remove('is-error'); setNote(defaultNote); }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!EMAIL.test(email)) {
        form.classList.add('is-error');
        setNote('Please enter a valid email address.', 'err');
        input.focus();
        return;
      }
      button.disabled = true;
      label.textContent = 'Joining…';
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, company: form.company.value, source: location.search || 'direct' })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
        form.classList.add('is-done');
        label.textContent = 'You’re in';
        input.value = '';
        input.blur();
        setNote(data.existing ? 'You’re already on the list. We’ll be in touch.' : 'Welcome to Basique. You’ll hear from us first.', 'ok');
      } catch (err) {
        button.disabled = false;
        label.textContent = 'Join the waitlist';
        setNote(err.message, 'err');
      }
    });
  });
})();
