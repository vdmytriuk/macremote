// Анімації сайту: сцена з прокруткою, поява блоків, 3D-нахил телефона, друкування тексту.
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- Поява блоків при прокрутці ----------
  const reveals = document.querySelectorAll('.reveal, .demo');
  if (reduced) {
    reveals.forEach((el) => el.classList.add('in', 'play'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          if (e.target.classList.contains('demo')) e.target.classList.add('play');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // ---------- Hero: нахил телефона за курсором ----------
  const tiltZone = document.getElementById('heroTilt');
  const heroPhone = document.getElementById('heroPhone');
  if (tiltZone && heroPhone && !reduced) {
    let rx = 0, ry = 0, tx = 0, ty = 0, raf = null;
    const render = () => {
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      heroPhone.style.transform = `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
      if (Math.abs(tx - rx) > 0.05 || Math.abs(ty - ry) > 0.05) raf = requestAnimationFrame(render);
      else raf = null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(render); };
    const hero = document.getElementById('top');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      ty = x * 26 - 12;
      tx = -y * 16;
      kick();
    });
    hero.addEventListener('pointerleave', () => { ty = -12; tx = 0; kick(); });
    ty = -12; kick();
  }

  // ---------- Сцена: телефон обертається, екрани й підписи змінюються ----------
  const scene = document.querySelector('[data-scene]');
  const scenePhone = document.getElementById('scenePhone');
  if (scene && scenePhone) {
    const segments = Number(getComputedStyle(scene).getPropertyValue('--segments')) || 5;
    const screens = scene.querySelectorAll('.screen.seg');
    const captions = scene.querySelectorAll('.caption');
    const dots = scene.querySelectorAll('.progress i');
    let active = -1;
    let ticking = false;

    const setActive = (seg) => {
      if (seg === active) return;
      active = seg;
      screens.forEach((s) => s.classList.toggle('on', Number(s.dataset.seg) === seg));
      captions.forEach((c) => c.classList.toggle('on', Number(c.dataset.seg) === seg));
      dots.forEach((d) => d.classList.toggle('on', Number(d.dataset.seg) === seg));
    };

    const update = () => {
      ticking = false;
      const rect = scene.getBoundingClientRect();
      const total = scene.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / total, 0, 1);
      const seg = Math.min(segments - 1, Math.floor(p * segments));
      const local = clamp(p * segments - seg, 0, 1);
      setActive(seg);
      if (reduced) return;

      // Вхід: телефон розвертається з 70° до робочого кута на першій чверті першого сегмента.
      const entry = seg === 0 ? 1 - ease(clamp(local * 4, 0, 1)) : 0;
      const sway = -16 + 32 * ease(local);
      const angleY = sway + entry * 70;
      const angleX = (0.5 - local) * 8 + entry * 10;
      const scale = 0.94 + 0.08 * Math.sin(local * Math.PI) - entry * 0.1;
      const lift = Math.sin(local * Math.PI) * -10;
      scenePhone.style.transform = `translateY(${lift.toFixed(1)}px) rotateY(${angleY.toFixed(2)}deg) rotateX(${angleX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  // ---------- Демо клавіатури: текст друкується сам ----------
  const typed = document.querySelector('.typed');
  if (typed) {
    const text = typed.dataset.text || '';
    const card = typed.closest('.demo');
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      if (reduced) { typed.textContent = text; return; }
      let i = 0;
      const step = () => {
        typed.textContent = text.slice(0, i++);
        if (i <= text.length) setTimeout(step, 38 + Math.random() * 50);
        else setTimeout(() => { i = 0; step(); }, 2600);
      };
      step();
    };
    if (card && !reduced) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { run(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(card);
    } else {
      run();
    }
  }

  // ---------- QR-код у демо меню: псевдовипадкова, але стабільна сітка ----------
  const qr = document.querySelector('.qrgrid');
  if (qr) {
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const n = 17;
    const frag = document.createDocumentFragment();
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const corner = (x < 5 && y < 5) || (x > n - 6 && y < 5) || (x < 5 && y > n - 6);
        const ring = corner && (x % (n - 1) === 0 || y % (n - 1) === 0 || x === 4 || y === 4 || x === n - 5 || y === n - 5);
        const core = corner && ((x >= 1 && x <= 3) || (x >= n - 4 && x <= n - 2)) && ((y >= 1 && y <= 3) || (y >= n - 4 && y <= n - 2)) && !(x === 2 && y === 2 && false);
        const dark = corner ? (ring || core) : rnd() > 0.55;
        const cell = document.createElement('i');
        if (dark) cell.className = 'd';
        frag.appendChild(cell);
      }
    }
    qr.appendChild(frag);
  }
})();
