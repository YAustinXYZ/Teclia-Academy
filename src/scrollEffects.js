export function initScrollEffects() {
  if (typeof window === 'undefined') return;
  try {
    const revealSelector = [
      'section',
      '.hero-card',
      '.feature-card',
      '.pricing-card',
      '.studio-card',
      '.contact-card',
      '.plan-card',
      '.profile-card',
      '.keyboard-shell',
      '.avatar-preview-card',
      '.profile-section h2',
      '.scale-note'
    ].join(',');

    const elements = Array.from(document.querySelectorAll(revealSelector));
    elements.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        } else {
          // allow small elements to hide again for subtle motion
          if (!entry.target.closest('.hero') && !entry.target.closest('.keyboard-shell')) {
            entry.target.classList.remove('show');
          }
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    elements.forEach((el, i) => {
      // staggered reveal
      el.style.setProperty('--reveal-delay', `${(i % 6) * 80}ms`);
      observer.observe(el);
    });

    // Special handling: keyboard-shell enters view -> gentle staggered key pulse
    const keyboardShell = document.querySelector('.keyboard-shell');
    if (keyboardShell) {
      const keys = Array.from(keyboardShell.querySelectorAll('.piano-key'));
      const kbObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            keyboardShell.classList.add('keyboard-inview');
            // stagger pulses
            keys.forEach((k, idx) => {
              const delay = (idx % 12) * 40;
              k.style.setProperty('--key-delay', `${delay}ms`);
              k.classList.add('pulse');
              // remove pulse class after animation to allow re-trigger
              setTimeout(() => k.classList.remove('pulse'), 1200 + delay);
            });
          } else {
            keyboardShell.classList.remove('keyboard-inview');
          }
        });
      }, { threshold: 0.28 });
      kbObserver.observe(keyboardShell);
    }

    // Parallax: elements with data-parallax attribute
    // add parallax attributes to prominent elements if not present
    const autoParallax = [
      '.hero-copy',
      '.hero-panel',
      '.hero-card',
      '.keyboard-shell',
    ];
    autoParallax.forEach((sel, i) => {
      const el = document.querySelector(sel);
      if (el && !el.hasAttribute('data-parallax')) el.setAttribute('data-parallax', (0.06 + i * 0.04).toString());
    });

    const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
    let latestKnownScrollY = 0;
    let ticking = false;

    function onScroll() {
      latestKnownScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = latestKnownScrollY;
          parallaxEls.forEach((el) => {
            const speed = parseFloat(el.dataset.parallax) || 0.15;
            const rect = el.getBoundingClientRect();
            const offset = (rect.top + window.scrollY) * speed;
            // use translate3d to hint GPU acceleration and reduce repaints
            const y = Math.round(offset * -0.02 * 100) / 100;
            el.style.transform = `translate3d(0, ${y}px, 0)`;
          });

          // header blur
          const topbar = document.querySelector('.topbar');
          if (topbar) {
            if (scrolled > 18) topbar.classList.add('scrolled'); else topbar.classList.remove('scrolled');
          }

          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // run once
    onScroll();

    // --- Section observer + scroll velocity detection ---
    const sections = Array.from(document.querySelectorAll('section'));
    let activeSection = null;
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0.6) {
          if (activeSection && activeSection !== entry.target) {
            activeSection.classList.remove('section-active');
          }
          activeSection = entry.target;
          entry.target.classList.add('section-active');
          document.body.dataset.activeSection = sections.indexOf(entry.target);
        } else {
          if (entry.target.classList.contains('section-active')) {
            entry.target.classList.remove('section-active');
          }
        }
      });
    }, { threshold: [0.6] });
    sections.forEach((s) => sectionObserver.observe(s));

    // scroll velocity for subtle tilt effects
    let lastY = window.scrollY;
    let lastTime = performance.now();
    function velocityTick() {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(16, now - lastTime);
      const vy = (y - lastY) / dt; // px per ms
      const velocity = Math.max(-1, Math.min(1, vy * 60));
      // set CSS var for use in styles
      document.documentElement.style.setProperty('--scroll-velocity', String(velocity));
      // add direction class briefly
      if (y > lastY) {
        document.body.classList.add('scrolling-down');
        document.body.classList.remove('scrolling-up');
      } else if (y < lastY) {
        document.body.classList.add('scrolling-up');
        document.body.classList.remove('scrolling-down');
      }
      lastY = y;
      lastTime = now;
      requestAnimationFrame(velocityTick);
    }
    requestAnimationFrame(velocityTick);
  } catch (err) {
    // silent
    // console.warn('scroll effects init failed', err);
  }
}
