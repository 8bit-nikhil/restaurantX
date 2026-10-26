const $ = (s, c = document) => [...c.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const MENU_PAGE_SIZE = 6;

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
 
/* ---------- typing effect (keeps coloured spans intact) ---------- */
function prep(e) {
  const h = e.offsetHeight, w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), a = [];
  let n;
  while ((n = w.nextNode())) if (n.nodeValue.trim()) a.push([n, n.nodeValue]);
  a.forEach(x => (x[0].nodeValue = ''));
  e._t = a;
  e.style.minHeight = h + 'px';
}
function typeEl(e, sp = 22) {
  return new Promise(res => {
    const a = e._t || [], T = a.reduce((s, x) => s + x[1].length, 0);
    let c = 0;
    e.classList.add('is-typing');
    const id = setInterval(() => {
      c++;
      let left = c;
      a.forEach(([n, s]) => { n.nodeValue = s.slice(0, Math.max(0, Math.min(s.length, left))); left -= s.length; });
      if (c >= T) { clearInterval(id); e.classList.remove('is-typing'); e.classList.add('is-complete'); res(); }
    }, sp);
  });
}
 
function shuffleMenuCards() {
  const cards = $('.menu-card');
  const categories = [...new Set(cards.map(card => card.dataset.c))];
  const featured = shuffled(categories.map(category =>
    shuffled(cards.filter(card => card.dataset.c === category))[0]
  ));
  const featuredSet = new Set(featured);
  $('#grid')[0].append(...featured, ...shuffled(cards.filter(card => !featuredSet.has(card))));
  const marquee = $('.food-marquee-track')[0];
  marquee.innerHTML += marquee.innerHTML;
  filt('All');
}
 
/* ---------- menu filter ---------- */
let activeCategory = 'All';
let visibleLimit = MENU_PAGE_SIZE;

function filt(c) {
  activeCategory = c;
  visibleLimit = MENU_PAGE_SIZE;
  $('.menu-filter-button,.category-card').forEach(b => b.classList.toggle('is-selected', b.dataset.c === c));
  renderMenuCards();
}

function renderMenuCards() {
  let shown = 0;
  const cards = $('.menu-card').filter(card => activeCategory === 'All' || card.dataset.c === activeCategory);
  $('.menu-card').forEach(card => {
    const matches = activeCategory === 'All' || card.dataset.c === activeCategory;
    const show = matches && shown < visibleLimit;
    if (matches) shown++;
    card.hidden = !show;
    if (show) { card.classList.add('is-visible'); card.classList.remove('is-pop-in'); void card.offsetWidth; card.classList.add('is-pop-in'); }
  });
  const showMore = $('#show-more')[0];
  const showLess = $('#show-less')[0];
  const remaining = Math.max(0, cards.length - visibleLimit);
  showMore.hidden = remaining === 0;
  showLess.hidden = visibleLimit <= MENU_PAGE_SIZE;
}
 
/* ---------- helpers ---------- */
const toast = m => {
  const t = $('#toast')[0];
  t.textContent = m; t.classList.add('is-selected');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-selected'), 2800);
};
function count(e) {
  const n = +e.dataset.n; let v = 0;
  const id = setInterval(() => { v += Math.ceil(n / 50); if (v >= n) { v = n; clearInterval(id); } e.textContent = v; }, 30);
}
function reveal(s) {
  $('.reveal-on-scroll', s).forEach((e, i) => { e.style.setProperty('--i', i); e.classList.add('is-visible'); });
  (async () => { for (const e of $('[data-type]', s).filter(e => e._t)) await typeEl(e, 16); })();
}
 
/* ---------- page start: intro -> nav -> hero typing -> scroll reveals ---------- */
async function hero() {
  const H = $('#home')[0];
  [...$('.hero-copy')[0].children].forEach((e, i) => e.style.setProperty('--hero-step', i));
  [...$('.hero-copy h1 > span')].forEach((e, i) => e.style.setProperty('--line-step', i));
  H.classList.add('has-entered');
  $('#nav .reveal-on-scroll').forEach((e, i) => { e.style.setProperty('--i', i * .6); e.classList.add('is-visible'); });
  $('.hero-visual')[0].classList.add('is-visible');
  $('[data-type]', H).forEach(e => e.classList.add('is-complete'));
  $('.reveal-on-scroll', H).forEach((e, i) => { e.style.setProperty('--i', i); e.classList.add('is-visible'); });
  $('[data-n]').forEach(count);
}
 
async function start() {
  shuffleMenuCards();
  const I = $('#intro')[0];
  if (RM) {
    I.classList.add('is-filled');
    await wait(1600);
    I.remove(); document.body.classList.remove('is-locked');
    $('#home')[0].classList.add('has-entered');
    $('.reveal-on-scroll').forEach(e => e.classList.add('is-visible'));
    $('[data-n]').forEach(e => (e.textContent = e.dataset.n));
    return;
  }
  const H = $('#home')[0];
  $('[data-type]').filter(e => !H.contains(e)).forEach(prep);
  I.classList.add('is-filled');
  for (const e of $('[data-type]', I)) await typeEl(e, 70);
  I.classList.add('is-exiting');
  await wait(1100);
  I.remove(); document.body.classList.remove('is-locked');
  await hero();
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { io.unobserve(en.target); reveal(en.target); }
  }), { threshold: .15 });
  $('.content-section, footer').forEach(s => io.observe(s));
}
Promise.race([document.fonts.ready, wait(1500)]).then(start);
 
/* ---------- interactions ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('#show-more')) {
    visibleLimit += MENU_PAGE_SIZE;
    renderMenuCards();
    return;
  }
  if (e.target.closest('#show-less')) {
    visibleLimit = MENU_PAGE_SIZE;
    renderMenuCards();
    $('#grid')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const b = e.target.closest('.menu-filter-button,.category-card,.add-to-order-button');
  if (b) {
    if (b.classList.contains('add-to-order-button')) return toast('Added to your order!');
    filt(b.dataset.c);
    if (b.classList.contains('category-card')) $('#menu')[0].scrollIntoView();
  }
  if (e.target.closest('#nav nav a')) $('#nav')[0].classList.remove('is-open');
});
$('#burger')[0].onclick = () => $('#nav')[0].classList.toggle('is-open');
$('#top')[0].onclick = () => scrollTo({ top: 0 });
$('form').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); toast(f.dataset.m); f.reset(); }));
 
/* 3D tilt on cards */
let last;
document.addEventListener('mousemove', e => {
  const t = e.target.closest('.tilt-effect');
  if (last && last !== t) last.style.transform = '';
  last = t;
  if (!t || RM) return;
  const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  t.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
});
 
/* scroll progress, sticky header, active link, back-to-top */
function onScroll() {
  const y = scrollY, h = document.documentElement;
  $('#prog')[0].style.width = (y / (h.scrollHeight - innerHeight)) * 100 + '%';
  $('#nav')[0].classList.toggle('is-scrolled', y > 40);
  $('#top')[0].classList.toggle('is-shown', y > 500);
  let cur = '#home';
  $('#nav .navigation-link').forEach(a => { const s = $(a.hash)[0]; if (s && s.offsetTop - 130 <= y) cur = a.hash; });
  $('#nav .navigation-link').forEach(a => a.classList.toggle('is-active', a.hash === cur));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();
 
/* countdown to midnight */
const pad = v => String(v).padStart(2, '0');
setInterval(() => {
  const n = new Date(), e = new Date(n); e.setHours(24, 0, 0, 0);
  const s = Math.floor((e - n) / 1000);
  $('#ch')[0].textContent = pad(Math.floor(s / 3600));
  $('#cm')[0].textContent = pad(Math.floor(s % 3600 / 60));
  $('#cs')[0].textContent = pad(s % 60);
}, 1000);