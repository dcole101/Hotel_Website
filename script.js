(() => {
  'use strict';

  /* ---------- 1. Placeholder images (generated SVG, no text) ---------- */
  const placeholder = (w, h, seed) => {
    const hue = 28 + (seed * 7) % 14;
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},28%,72%)"/>
      <stop offset="1" stop-color="hsl(${hue},32%,42%)"/>
    </linearGradient>
    <radialGradient id="v" cx=".5" cy=".5" r=".75">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#1a0806" stop-opacity=".6"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g fill="hsl(${hue},25%,30%)" fill-opacity=".55">
    <circle cx="${w * 0.68}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.09}"/>
    <path d="M0 ${h} L${w * 0.28} ${h * 0.52} L${w * 0.46} ${h * 0.74} L${w * 0.66} ${h * 0.44} L${w} ${h} Z"/>
  </g>
  <rect width="100%" height="100%" fill="url(#v)"/>
</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
  };

  document.querySelectorAll('img[data-ph]').forEach((img, i) => {
    const w = +img.dataset.w || 400;
    const h = +img.dataset.h || 300;
    img.src = placeholder(w, h, i);
    img.width = w;
    img.height = h;
    img.loading = 'lazy';
    img.decoding = 'async';
  });

  /* ---------- 2. Gold frame corner hooks ---------- */
  document.querySelectorAll('.gold-frame').forEach((frame) => {
    ['c1', 'c2'].forEach((cls) => {
      const s = document.createElement('span');
      s.className = cls;
      s.setAttribute('aria-hidden', 'true');
      frame.appendChild(s);
    });
  });

  /* ---------- 3. Torn paper edges ---------- */
  const rand = (min, max) => Math.random() * (max - min) + min;

  const tornPolygon = (amp) => {
    const pts = [];
    const steps = 46;
    // top edge, left -> right
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * 100;
      pts.push(`${x.toFixed(2)}% ${rand(0, amp).toFixed(1)}px`);
    }
    // bottom edge, right -> left
    for (let i = steps; i >= 0; i--) {
      const x = (i / steps) * 100;
      pts.push(`${x.toFixed(2)}% calc(100% - ${rand(0, amp).toFixed(1)}px)`);
    }
    return `polygon(${pts.join(',')})`;
  };

  // clip-path on the element would also clip its drop-shadow filter,
  // so wrap the clipped paper in a shadow-casting shell.
  document.querySelectorAll('[data-torn]').forEach((el) => {
    const amp = el.classList.contains('scrap') || el.classList.contains('movie-stub') ? 6 : 9;
    el.style.clipPath = tornPolygon(amp);
    // shadow is applied via a parent-level filter alternative
    el.style.filter = 'none';
    el.style.boxShadow = 'none';
  });

  // Re-apply a soft shadow using a sibling-safe approach: outline panels with a wrapper
  document.querySelectorAll('.panel, .footer').forEach((el) => {
    const wrap = document.createElement('div');
    wrap.className = el.className.replace('paper', '').replace('panel', 'panel-shell').replace('footer', 'footer-shell').replace('reveal', '').trim();
    wrap.style.filter = 'drop-shadow(0 12px 20px rgba(0,0,0,.55))';
    wrap.style.width = el.classList.contains('footer') ? 'min(900px, calc(100% - 2rem))' : '100%';
    if (el.classList.contains('footer')) wrap.style.margin = '4.5rem auto 4rem';
    el.style.margin = '0';
    el.style.width = '100%';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
    el.classList.contains('reveal') && wrap.classList.add('reveal-host');
  });

  /* ---------- 4. Scroll reveal ---------- */
  const targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add('in'));
  }

  /* ---------- 5. Gentle paper tilt on process cards & artists ---------- */
  document.querySelectorAll('.step, .artists li').forEach((el, i) => {
    el.style.transform = `rotate(${((i % 5) - 2) * 0.5}deg)`;
  });

  /* ---------- 6. Hero parallax on stacked paper scraps ---------- */
  const scraps = document.querySelectorAll('.scrap, .coin, .movie-stub');
  if (scraps.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY, 600);
      scraps.forEach((s, i) => {
        s.style.translate = `0 ${(y * (0.04 + i * 0.015)).toFixed(1)}px`;
      });
    }, { passive: true });
  }
})();

/* ---------- Site header ---------- */
(() => {
  const slug = (t) => t.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // give each section an id from its heading, so the nav links work without editing the HTML
  document.querySelectorAll('.panel-head h2').forEach((h) => {
    const section = h.closest('.panel');
    if (section && !section.id) section.id = slug(h.textContent);
  });

  const toggle = document.querySelector('.site-header__toggle');
  const nav = document.querySelector('.site-header__nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1020) setOpen(false); });
})();