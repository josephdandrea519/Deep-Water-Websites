/* ========================================
   SHARED JS — Deep Water Websites
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── CUSTOM CURSOR ─── */
  const cursor = document.querySelector('.cursor');
  const ring   = document.querySelector('.cursor-ring');

  if (cursor && ring && window.matchMedia('(pointer: fine)').matches) {
    let mx = 0, my = 0;   // actual mouse position
    let rx = 0, ry = 0;   // ring lerp position
    let rafId = null;
    let visible = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      rafId = requestAnimationFrame(tick);
    }

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
      if (!visible) {
        cursor.classList.add('visible');
        ring.classList.add('visible');
        rx = mx; ry = my; // snap ring to start position
        visible = true;
        tick();
      }
    });

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('visible');
      ring.classList.remove('visible');
    });

    document.addEventListener('mouseenter', () => {
      if (visible) {
        cursor.classList.add('visible');
        ring.classList.add('visible');
      }
    });
  } else if (cursor && ring) {
    // touch / coarse pointer — hide cursor elements entirely
    cursor.style.display = 'none';
    ring.style.display   = 'none';
  }

  /* ─── MOBILE MENU ─── */
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      toggle.textContent = mobileNav.classList.contains('open') ? '✕' : '☰';
    });
  }

  /* ─── SCROLL ANIMATIONS ─── */
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up').forEach((el, i) => {
    if (!el.dataset.delay) el.dataset.delay = i % 4 * 80;
    observer.observe(el);
  });

  /* ─── FAQ ACCORDION ─── */
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ─── PRICING TOGGLE (build packages vs maintenance) ─── */
  const pricingToggle = document.querySelector('.toggle-switch');
  if (pricingToggle) {
    const oneTimeLabel  = document.querySelector('[data-pricing="onetime"]');
    const monthlyLabel  = document.querySelector('[data-pricing="monthly"]');
    const oneTimePrices = document.querySelectorAll('[data-onetime]');
    const monthlyPrices = document.querySelectorAll('[data-monthly]');

    pricingToggle.addEventListener('click', () => {
      pricingToggle.classList.toggle('monthly');
      const isMonthly = pricingToggle.classList.contains('monthly');

      if (oneTimeLabel)  oneTimeLabel.classList.toggle('active', !isMonthly);
      if (monthlyLabel)  monthlyLabel.classList.toggle('active', isMonthly);

      oneTimePrices.forEach(el => {
        el.closest('.pricing-card').style.display = isMonthly ? 'none' : 'flex';
      });
      monthlyPrices.forEach(el => {
        el.closest('.pricing-card').style.display = isMonthly ? 'flex' : 'none';
      });
    });
  }

  /* ─── ACTIVE NAV LINK ─── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

});
