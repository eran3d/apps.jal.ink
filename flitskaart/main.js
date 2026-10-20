/* Flitskaart landing: interactions. Motion (motion.dev) for reveals and scroll, a small rAF tween for the deck. */
(() => {
  const { animate, inView, scroll, stagger } = window.Motion || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 961px)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ease = [0.2, 0.8, 0.2, 1];
  const pop = [0.34, 1.56, 0.64, 1];

  // Without Motion (blocked script), show everything statically.
  if (!animate) { document.documentElement.classList.remove('js'); }

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Tween helper ---------- */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function tween(dur, onUpdate, fn = easeOut) {
    return new Promise(res => {
      if (reduce) { onUpdate(1); return res(); }
      const t0 = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - t0) / dur);
        onUpdate(fn(t));
        t < 1 ? requestAnimationFrame(tick) : res();
      };
      requestAnimationFrame(tick);
    });
  }
  const springOut = t => 1 - Math.exp(-6 * t) * Math.cos(9 * t);

  /* ---------- Hero intro ---------- */
  if (animate && !reduce) {
    animate('.hero .eyebrow, .hero-title .line, .hero-sub, .hero-ctas, .hero-hint',
      { opacity: [0, 1], transform: ['translateY(30px)', 'translateY(0px)'] },
      { duration: 0.9, delay: stagger(0.08, { startDelay: 0.1 }), ease });
    animate('.flash', { opacity: [0, 1, 0.2, 1, 0.6, 1] }, { duration: 0.9, delay: 0.55 });
    animate('.deck-wrap', { opacity: [0, 1], transform: ['translateY(60px) rotate(4deg)', 'translateY(0px) rotate(0deg)'] },
      { duration: 1.1, delay: 0.3, ease });
  }

  /* ---------- Rotator ---------- */
  const rotator = $('#rotator');
  const words = ['Frans', 'Duits', 'topografie', 'Engels', 'begrippen', 'hoofdsteden', 'Spaans'];
  let wi = 0;
  if (!reduce && animate) {
    setInterval(() => {
      if (document.hidden) return;
      const old = rotator.firstElementChild;
      wi = (wi + 1) % words.length;
      const next = document.createElement('span');
      next.textContent = words[wi];
      rotator.appendChild(next);
      const from = old.offsetWidth, to = next.offsetWidth;
      animate(rotator, { width: [from + 'px', to + 'px'] }, { duration: 0.6, ease });
      animate(old, { transform: ['translateY(0)', 'translateY(-105%)'], opacity: [1, 0] }, { duration: 0.5, ease })
        .then(() => { old.remove(); rotator.style.width = ''; });
      animate(next, { transform: ['translateY(105%)', 'translateY(0)'], opacity: [0, 1] }, { duration: 0.6, ease });
    }, 2300);
  }

  /* ---------- Spark field (canvas) ---------- */
  const canvas = $('#sparkfield');
  const ctx = canvas.getContext('2d');
  const hero = $('.hero');
  let W = 0, H = 0, dpr = 1, stars = [], trail = [], heroVisible = true;
  function sizeCanvas() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(W * H / 26000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 1.5 + Math.random() * 4, p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 1.4
    }));
  }
  function drawSpark(x, y, r, a) {
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  }
  function frame(t) {
    if (heroVisible) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#C6FF3D';
      for (const s of stars) {
        const tw = (Math.sin(t / 1000 * s.s + s.p) + 1) / 2;
        drawSpark(s.x, s.y, s.r * (0.4 + tw * 0.8), 0.08 + tw * 0.35);
      }
      trail = trail.filter(p => p.life > 0);
      for (const p of trail) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= 0.022;
        drawSpark(p.x, p.y, p.r * p.life, Math.max(0, p.life));
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  if (!reduce) {
    sizeCanvas();
    addEventListener('resize', sizeCanvas);
    let last = 0;
    hero.addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - last < 28 || e.pointerType === 'touch') return;
      last = now;
      const b = canvas.getBoundingClientRect();
      trail.push({ x: e.clientX - b.left, y: e.clientY - b.top, vx: (Math.random() - .5) * 1.2, vy: -Math.random() * 1.2, r: 4 + Math.random() * 7, life: 1 });
    });
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }).observe(hero);
    requestAnimationFrame(frame);
  }

  /* ---------- Deck ---------- */
  const cards = [
    { deck: 'FRANS · NEDERLANDS', kind: 'Frans', q: 'l’école', a: 'de school' },
    { deck: 'TOPOGRAFIE', kind: 'Hoofdstad', q: 'Portugal', a: 'Lissabon' },
    { deck: 'DUITS · NEDERLANDS', kind: 'Duits', q: 'der Schmetterling', a: 'de vlinder' },
    { deck: 'AARDRIJKSKUNDE', kind: 'Begrip', q: 'Delta', a: 'Waar een rivier zich bij de monding in armen splitst', long: true },
    { deck: 'ENGELS · NEDERLANDS', kind: 'Engels', q: 'to remember', a: 'onthouden' },
    { deck: 'FRANS · NEDERLANDS', kind: 'Frans', q: 'apprendre', a: 'leren' },
    { deck: 'TOPOGRAFIE', kind: 'Hoofdstad', q: 'Noorwegen', a: 'Oslo' },
  ];
  const deckEl = $('#deck');
  const deckName = $('#deck-name');
  const deckCount = $('#deck-count');
  let next = 0, busy = false, lastInteract = 0;
  const STACK = 3;

  function makeCard(c) {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-inner">
        <div class="face face-front"><span class="kind">${c.kind}</span><div class="q">${c.q}</div><span class="tapme">tik om te draaien</span></div>
        <div class="face face-back"><span class="kind">${c.kind}</span><div class="q">${c.q}</div><div class="rule"></div><div class="a${c.long ? ' long' : ''}">${c.a}</div></div>
      </div>
      <span class="stamp stamp-good">WEET IK</span>
      <span class="stamp stamp-again">NOG NIET</span>`;
    el._data = c;
    el._idx = next;
    next = (next + 1) % cards.length;
    return el;
  }
  function layout(animateIt = true) {
    const list = $$('.card', deckEl);
    list.forEach((el, i) => {
      const target = { s: 1 - i * 0.05, y: i * 36, o: i < STACK ? 1 - i * 0.25 : 0 };
      el.style.zIndex = String(10 - i);
      const fromS = el._s ?? target.s + 0.05, fromY = el._y ?? target.y + 20, fromO = el._o ?? 0;
      const apply = (s, y, o) => { el._s = s; el._y = y; el._o = o; el.style.transform = `translateY(${y}px) scale(${s})`; el.style.opacity = o; };
      if (!animateIt) return apply(target.s, target.y, target.o);
      tween(520, k => apply(fromS + (target.s - fromS) * k, fromY + (target.y - fromY) * k, fromO + (target.o - fromO) * k), springOut);
    });
    const top = list[0];
    if (top) {
      deckName.textContent = top._data.deck;
      deckCount.textContent = `kaart ${top._idx + 1} van ${cards.length}`;
    }
  }
  function fill() {
    while ($$('.card', deckEl).length < STACK + 1) deckEl.appendChild(makeCard(cards[next]));
  }
  fill(); layout(false);

  function setStamps(el, dx) {
    const k = Math.max(-1, Math.min(1, dx / 110));
    $('.stamp-good', el).style.opacity = Math.max(0, k);
    $('.stamp-again', el).style.opacity = Math.max(0, -k);
  }
  function fly(el, dir, dx = 0, dy = 0, rot = 0) {
    busy = true;
    el.style.pointerEvents = 'none';
    const toX = dir * (innerWidth * 0.6 + 300);
    setStamps(el, dir * 110);
    return tween(480, k => {
      const x = dx + (toX - dx) * k, y = dy + 60 * k, r = rot + (dir * 24 - rot) * k;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
      el.style.opacity = 1 - k * 0.9;
    }, t => t * t).then(() => {
      el.remove(); fill(); layout(); busy = false;
    });
  }
  function rate(dir) {
    const top = $('.card', deckEl);
    if (!top || busy) return;
    lastInteract = performance.now();
    if (!top.classList.contains('is-flipped')) {
      top.classList.add('is-flipped');
      busy = true;
      setTimeout(() => fly(top, dir), reduce ? 0 : 420);
    } else fly(top, dir);
  }
  $('#btn-good').addEventListener('click', () => rate(1));
  $('#btn-again').addEventListener('click', () => rate(-1));

  let drag = null;
  deckEl.addEventListener('pointerdown', e => {
    const top = $('.card', deckEl);
    if (!top || busy || !top.contains(e.target)) return;
    drag = { el: top, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, t0: performance.now(), moved: false };
    top.setPointerCapture(e.pointerId);
    lastInteract = performance.now();
  });
  deckEl.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x0; drag.dy = (e.clientY - drag.y0) * 0.4;
    if (Math.abs(drag.dx) > 6) drag.moved = true;
    if (!drag.moved) return;
    const r = drag.dx * 0.06;
    drag.el.style.transform = `translate(${drag.dx}px, ${drag.dy}px) rotate(${r}deg)`;
    setStamps(drag.el, drag.dx);
    // As in the app: dragging opens the card so you see the answer before letting go.
    if (Math.abs(drag.dx) > 50) drag.el.classList.add('is-flipped');
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    lastInteract = performance.now();
    if (!d.moved) { d.el.classList.toggle('is-flipped'); return; }
    const v = d.dx / Math.max(1, performance.now() - d.t0);
    if (Math.abs(d.dx) > 110 || Math.abs(v) > 0.8) {
      fly(d.el, Math.sign(d.dx), d.dx, d.dy, d.dx * 0.06);
    } else {
      const sx = d.dx, sy = d.dy;
      tween(600, k => {
        const x = sx * (1 - k), y = sy * (1 - k);
        d.el.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.06}deg)`;
        setStamps(d.el, x);
      }, springOut);
    }
  };
  deckEl.addEventListener('pointerup', endDrag);
  deckEl.addEventListener('pointercancel', endDrag);

  // Autoplay demo while the deck is on screen and nobody is touching it.
  let deckVisible = false;
  new IntersectionObserver(([en]) => { deckVisible = en.isIntersecting; }, { threshold: 0.5 }).observe(deckEl);
  if (!reduce) {
    let phase = 0;
    setInterval(() => {
      if (!deckVisible || busy || drag || document.hidden || performance.now() - lastInteract < 7000) return;
      const top = $('.card', deckEl);
      if (!top) return;
      if (phase === 0) { top.classList.add('is-flipped'); phase = 1; }
      else { fly(top, Math.random() < 0.75 ? 1 : -1); phase = 0; }
    }, 1700);
  }

  /* ---------- Marquee ---------- */
  const mItems = [
    ['la pomme', 'de appel', 'Frans'], ['Kopenhagen', 'Denemarken', 'Topografie', '#3DD6FF'], ['der Hund', 'de hond', 'Duits', '#FFB020'],
    ['the butterfly', 'de vlinder', 'Engels'], ['Erosie', 'afslijting door water of wind', 'Begrip', '#B48CFF'], ['el gato', 'de kat', 'Spaans', '#FF4D6D'],
    ['manger', 'eten', 'Frans'], ['Mount Everest', '8.849 m', 'Aardrijkskunde', '#3DD6FF'], ['die Brücke', 'de brug', 'Duits', '#FFB020'],
    ['Fotosynthese', 'licht wordt suiker', 'Biologie', '#B48CFF'], ['la fenêtre', 'het raam', 'Frans'], ['Ljubljana', 'Slovenië', 'Topografie', '#3DD6FF'],
  ];
  const rows = $$('.marquee-row');
  const mState = rows.map((row, ri) => {
    const items = ri ? [...mItems].reverse() : mItems;
    const html = items.map(([q, a, tag, c]) =>
      `<span class="mcard"><span class="tag">${tag}</span>${q}<span class="arrow">→</span><span class="ans" style="--c:${c || '#C6FF3D'}">${a}</span></span>`).join('');
    row.innerHTML = html + html;
    return { row, x: ri ? -row.scrollWidth / 2 : 0, dir: Number(row.dataset.dir) };
  });
  if (!reduce) {
    let lastY = scrollY, boost = 0, visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe($('.marquee'));
    const tick = () => {
      const dy = scrollY - lastY; lastY = scrollY;
      boost = boost * 0.9 + Math.abs(dy) * 0.08;
      if (visible) for (const m of mState) {
        const half = m.row.scrollWidth / 2;
        m.x += m.dir * (0.45 + boost);
        if (m.x <= -half) m.x += half;
        if (m.x > 0) m.x -= half;
        m.row.style.transform = `translate3d(${m.x}px,0,0)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (!animate) return;

  /* ---------- Generic reveals ---------- */
  inView('.reveal, .reveal-up', ({ target: el }) => {
    animate(el, { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] }, { duration: reduce ? 0 : 0.9, ease });
  }, { amount: 0.2 });
  inView('.tile-voice', ({ target: el }) => { el.classList.add('is-in'); });

  /* ---------- Photo scan ---------- */
  const stage = $('#photo-stage');
  inView(stage, () => {
    const scan = $('.scanline', stage);
    const lis = $$('.paper-list li', stage);
    const chips = $('#chips');
    const count = $('#chip-count');
    stage.classList.add('is-scanning');
    const paperH = $('.paper', stage).offsetHeight;
    animate(scan, { opacity: [0, 1, 1, 0], transform: ['translateY(-80px)', `translateY(${paperH}px)`] },
      { duration: reduce ? 0 : 2.6, ease: 'linear', delay: 0.3 });
    lis.forEach((li, i) => {
      setTimeout(() => {
        li.classList.add('is-read');
        const [q, a] = $$('span', li).map(s => s.textContent);
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `<b>${q}</b><span>${a}</span>`;
        chips.appendChild(chip);
        count.textContent = `${i + 1} kaart${i ? 'en' : ''}`;
        animate(chip, { opacity: [0, 1], transform: ['translateX(-40px) scale(0.9)', 'translateX(0px) scale(1)'] }, { duration: 0.55, ease: pop });
        animate(count, { transform: ['scale(1.25)', 'scale(1)'] }, { duration: 0.3 });
      }, reduce ? 0 : 700 + i * 360);
    });
  }, { amount: 0.45 });

  /* ---------- Forgetting curve ---------- */
  const line = $('#curve-line'), area = $('#curve-area'), dots = $$('#curve-dots circle');
  const len = line.getTotalLength();
  line.style.strokeDasharray = len;
  line.style.strokeDashoffset = reduce ? 0 : len;
  if (!reduce) {
    area.style.opacity = 0;
    dots.forEach(d => { d.style.transformOrigin = 'center'; d.style.transformBox = 'fill-box'; d.style.transform = 'scale(0)'; });
    const marks = [0.16, 0.38, 0.66];
    const ivs = $$('#intervals li');
    scroll(p => {
      line.style.strokeDashoffset = len * (1 - p);
      area.style.opacity = Math.max(0, (p - 0.6) / 0.4);
      dots.forEach((d, i) => { d.style.transform = p > marks[i] ? 'scale(1)' : 'scale(0)'; d.style.transition = 'transform .35s cubic-bezier(.3,1.6,.5,1)'; });
      ivs.forEach((li, i) => { li.style.opacity = p > i / ivs.length * 0.9 ? 1 : 0.25; li.style.transition = 'opacity .3s'; });
    }, { target: $('#herhalen'), offset: ['start 0.85', 'center 0.45'] });
  }

  /* ---------- Sticky showcase ---------- */
  const steps = $$('.step'), screens = $$('.phone-big .screen'), sdots = $$('.step-dots i');
  const phoneBig = $('.phone-big');
  let cur = 0;
  scroll(p => {
    if (!desktop.matches) return;
    const idx = Math.min(2, Math.floor(p * 3));
    if (idx !== cur) {
      cur = idx;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      screens.forEach((s, i) => s.classList.toggle('is-on', i === idx));
      sdots.forEach((d, i) => d.classList.toggle('on', i === idx));
    }
    if (!reduce) phoneBig.style.transform = `perspective(1200px) rotateY(${(0.5 - p) * 16}deg) rotateX(${(p - 0.5) * 6}deg) translateY(${(0.5 - p) * 30}px)`;
  }, { target: $('.showcase'), offset: ['start start', 'end end'] });

  /* ---------- Counters ---------- */
  const nl = new Intl.NumberFormat('nl-NL');
  inView('[data-count]', ({ target: el }) => {
    const n = Number(el.dataset.count);
    const fmt = v => el.dataset.format === 'nl' ? nl.format(v) : String(v);
    tween(1600, k => { el.textContent = fmt(Math.round(n * k)); }, t => 1 - Math.pow(1 - t, 4));
  }, { amount: 0.6 });

  /* ---------- Heatmap ---------- */
  const heat = $('#heatmap');
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let c = 0; c < 26; c++) for (let r = 0; r < 7; r++) {
    const i = document.createElement('i');
    const active = c >= 5 && !(c === 25 && r > 3);
    const v = rnd();
    const lvl = !active ? 0 : v < 0.1 ? 0 : v < 0.25 ? 1 : v < 0.8 ? 2 : 3;
    i.dataset.lvl = lvl;
    heat.appendChild(i);
  }
  inView(heat, () => {
    $$('i', heat).forEach((cell, k) => {
      const col = Math.floor(k / 7);
      setTimeout(() => {
        if (cell.dataset.lvl > 0) cell.className = 'h' + cell.dataset.lvl;
        if (!reduce) animate(cell, { transform: ['scale(0.4)', 'scale(1)'] }, { duration: 0.45, ease: pop });
      }, reduce ? 0 : col * 40 + (k % 7) * 16);
    });
  }, { amount: 0.4 });

  /* ---------- Badges ---------- */
  inView('#badges', ({ target: el }) => {
    animate($$('.badge', el), { opacity: [0, 1], transform: ['translateY(30px) scale(0.8)', 'translateY(0px) scale(1)'] },
      { delay: stagger(0.09), duration: 0.6, ease: pop });
  }, { amount: 0.3 });
  if (!reduce) $$('.badge').forEach(b => { b.style.opacity = 0; });

  /* ---------- Bento spotlight ---------- */
  $$('.tile').forEach(t => t.addEventListener('pointermove', e => {
    const b = t.getBoundingClientRect();
    t.style.setProperty('--mx', `${e.clientX - b.left}px`);
    t.style.setProperty('--my', `${e.clientY - b.top}px`);
  }));

  /* ---------- CTA sparks ---------- */
  if (!reduce) {
    $$('.cta-spark').forEach((s, i) => animate(s, { transform: ['scale(0.6) rotate(0deg)', 'scale(1.15) rotate(90deg)', 'scale(0.6) rotate(180deg)'] },
      { duration: 2.4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }));
    inView('.cta-icon', ({ target: el }) => {
      animate(el, { transform: ['scale(0.6) rotate(-12deg)', 'scale(1) rotate(0deg)'] }, { duration: 0.9, ease: pop });
    });
  }
})();
