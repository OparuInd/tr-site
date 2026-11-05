// Tungsten Royce — page behaviour. No library.
document.documentElement.classList.remove('no-js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// light / dark grade: a click, remembered; never by scrolling
const root = document.documentElement;
document.querySelectorAll('.theme').forEach((btn) => {
  const sync = () => { const d = root.dataset.theme === 'dark'; btn.setAttribute('aria-pressed', String(d)); btn.setAttribute('aria-label', d ? 'Switch to light' : 'Switch to dark'); };
  btn.addEventListener('click', () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('tr-theme', root.dataset.theme); } catch {} sync(); });
  sync();
});

// nav: hairline + solid ground once the page has moved
const nav = document.querySelector('.nav');
const onScroll = () => nav && nav.classList.toggle('is-scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// scroll reveal: one entrance per container, once. A scroll listener catches jumps past a group
// (anchor links, restored scroll), which an IntersectionObserver alone never sees.
const pending = new Set(document.querySelectorAll('[data-reveal]'));
const reveal = (el) => { el.classList.add('is-in'); pending.delete(el); };
const sweep = () => { for (const el of pending) if (el.getBoundingClientRect().top < innerHeight * 0.9) reveal(el); };
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  pending.forEach((el) => io.observe(el));
  let t = 0; addEventListener('scroll', () => { if (!t) t = requestAnimationFrame(() => { t = 0; sweep(); }); }, { passive: true });
  sweep();
} else pending.forEach(reveal);

// hero film: play when it can, honour reduced motion, sound toggle
const film = document.querySelector('.hero--film2 video');
if (film) {
  if (reduce) { film.removeAttribute('autoplay'); film.pause(); }
  else film.play().catch(() => {});
  const snd = document.querySelector('.hero__sound');
  if (snd) snd.addEventListener('click', () => { film.muted = !film.muted; snd.setAttribute('aria-pressed', String(!film.muted)); snd.querySelector('span').textContent = film.muted ? 'Sound on' : 'Sound off'; });
}
// band films: play only while on screen
document.querySelectorAll('video[data-inview]').forEach((v) => {
  if (reduce) return;
  new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 }).observe(v);
});

// project filter: crossfade the wall
const chips = document.querySelector('.chips');
if (chips) {
  const wall = document.querySelector('.wall[data-filter]');
  chips.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chip'); if (!b) return;
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    const f = b.dataset.f;
    const apply = () => { wall.querySelectorAll('a').forEach((a) => a.classList.toggle('is-out', f !== 'all' && a.dataset.family !== f)); wall.classList.remove('is-swapping'); };
    if (reduce) return apply();
    wall.classList.add('is-swapping'); setTimeout(apply, 170);
  });
}

// view transitions: name the clicked cover so it carries to the project hero
document.querySelectorAll('a[data-vt]').forEach((a) => a.addEventListener('click', () => {
  const img = a.querySelector('img'); if (img) img.style.viewTransitionName = 'hero';
}));

// lightbox for project galleries
const lb = document.querySelector('.lb');
if (lb) {
  const items = [...document.querySelectorAll('[data-lb] a')];
  const img = lb.querySelector('img'), count = lb.querySelector('.lb__count');
  let i = 0;
  const show = (n) => { i = (n + items.length) % items.length; img.src = items[i].href; img.alt = items[i].querySelector('img').alt; count.textContent = `${i + 1} / ${items.length}`; };
  items.forEach((a, n) => a.addEventListener('click', (e) => { e.preventDefault(); show(n); lb.showModal(); }));
  lb.querySelector('.lb__x').addEventListener('click', () => lb.close());
  lb.querySelector('.lb__p').addEventListener('click', () => show(i - 1));
  lb.querySelector('.lb__n').addEventListener('click', () => show(i + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
}

// quote form: hold the request locally until the backend is wired (see README)
const form = document.querySelector('form.form');
if (form) form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  try { const q = JSON.parse(localStorage.getItem('tr-quotes') || '[]'); q.push({ ...data, at: new Date().toISOString() }); localStorage.setItem('tr-quotes', JSON.stringify(q)); } catch {}
  form.classList.add('is-sent');
  const ok = form.nextElementSibling; if (ok) { ok.focus?.(); ok.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
});
