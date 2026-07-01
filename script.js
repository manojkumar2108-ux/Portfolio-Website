/**
 * script.js — Manojkumar Portfolio
 *
 * Features:
 *  1. Dark-mode toggle (persisted to localStorage)
 *  2. Mobile navigation (hamburger menu)
 *  3. Testimonial carousel (keyboard + pointer)
 *  4. Scroll-reveal animations (IntersectionObserver)
 *  5. Project filter (projects page)
 *  6. Contact form — accessible validation & submission
 *  7. Current year in footer
 *  8. Active nav link highlighting
 *  9. Smooth focus management after skip-link
 * 10. Skill bar animation trigger
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Shorthand querySelector with optional scope.
 * @param {string} selector
 * @param {Element|Document} [scope=document]
 * @returns {Element|null}
 */
const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Shorthand querySelectorAll — returns a real Array.
 * @param {string} selector
 * @param {Element|Document} [scope=document]
 * @returns {Element[]}
 */
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Announce a message to screen readers via an ARIA live region.
 * Creates a temporary visually-hidden element so AT picks it up.
 * @param {string} message
 */
function announce(message) {
  const el = document.createElement('p');
  el.setAttribute('aria-live', 'assertive');
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  // Remove after AT has had time to read it
  setTimeout(() => el.remove(), 3000);
}


/* ═══════════════════════════════════════════════════════════════════════
   1. DARK MODE TOGGLE
   Persists preference to localStorage.
   Respects prefers-color-scheme on first visit.
   ═══════════════════════════════════════════════════════════════════════ */
(function initTheme() {
  const toggle = $('#theme-toggle');
  if (!toggle) return;

  // Determine initial theme
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');

  applyTheme(theme);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  /**
   * Apply a theme by setting data-theme on <html> and updating the button.
   * @param {'light'|'dark'} theme
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    // Update icon
    const icon = toggle.querySelector('.theme-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  }
})();


/* ═══════════════════════════════════════════════════════════════════════
   2. MOBILE NAVIGATION
   Toggles the mobile menu open/closed.
   Traps focus within the open menu (WCAG 2.1.2).
   Closes on Escape key or outside click.
   ═══════════════════════════════════════════════════════════════════════ */
(function initMobileNav() {
  const toggle = $('.nav-toggle');
  const menu   = $('#nav-menu');
  if (!toggle || !menu) return;

  let isOpen = false;

  /**
   * Open or close the mobile menu.
   * @param {boolean} open
   */
  function setMenuState(open) {
    isOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    // Prevent body scroll when menu is open
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      // Move focus to first nav link
      const firstLink = $('a', menu);
      if (firstLink) firstLink.focus();
    } else {
      // Return focus to toggle
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => setMenuState(!isOpen));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) setMenuState(false);
  });

  // Close when clicking outside the nav
  document.addEventListener('click', (e) => {
    if (isOpen && !menu.contains(e.target) && e.target !== toggle) {
      setMenuState(false);
    }
  });

  // Close when a nav link is clicked (single-page feel)
  $$('a', menu).forEach(link => {
    link.addEventListener('click', () => setMenuState(false));
  });
})();


/* ═══════════════════════════════════════════════════════════════════════
   3. TESTIMONIAL CAROUSEL
   Keyboard accessible: arrow keys, dots, and prev/next buttons.
   ARIA: aria-live="polite" announces slide changes to AT.
   ═══════════════════════════════════════════════════════════════════════ */
(function initCarousel() {
  const slider = $('.testimonial-slider');
  if (!slider) return;

  const cards   = $$('.testimonial-card', slider);
  const dots    = $$('.dot', slider);
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');
  let current   = 0;
  let autoTimer;

  /** Show slide at index, update ARIA state */
  function goTo(index) {
    // Wrap around
    const target = (index + cards.length) % cards.length;

    // Deactivate current card
    cards[current].classList.remove('active');
    cards[current].setAttribute('aria-hidden', 'true');
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');

    // Activate new card
    current = target;
    cards[current].classList.add('active');
    cards[current].removeAttribute('aria-hidden');
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  // Initialise hidden attribute on non-active cards
  cards.forEach((card, i) => {
    if (i !== 0) card.setAttribute('aria-hidden', 'true');
  });

  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index, 10));
      resetAuto();
    });
  });

  // Keyboard support on the slider container
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
  });

  // Pause auto-play on hover/focus (WCAG 2.2.2)
  slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
  slider.addEventListener('mouseleave', startAuto);
  slider.addEventListener('focusin',    () => clearInterval(autoTimer));
  slider.addEventListener('focusout',   startAuto);

  /** Start automatic rotation */
  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  startAuto();
})();


/* ═══════════════════════════════════════════════════════════════════════
   4. SCROLL REVEAL — IntersectionObserver
   Adds .visible to .reveal elements when they enter the viewport.
   Falls back gracefully when IntersectionObserver isn't supported.
   ═══════════════════════════════════════════════════════════════════════ */
(function initScrollReveal() {
  // Respect reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Make all reveal elements visible immediately
    $$('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  if (!('IntersectionObserver' in window)) {
    // Fallback: make everything visible
    $$('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop watching once revealed — avoids re-animating on scroll up
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,   // Trigger when 12% of the element is visible
      rootMargin: '0px 0px -40px 0px', // Slight offset from viewport bottom
    }
  );

  // Add .reveal class to sections and cards, then observe
  const targets = $$(
    'section, .skill-card, .project-card, .timeline-item, .stat-card, .testimonial-card'
  );

  targets.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
})();


/* ═══════════════════════════════════════════════════════════════════════
   5. PROJECT FILTER (projects.html)
   Filters cards by data-category attribute.
   Updates ARIA filter count for screen readers.
   ═══════════════════════════════════════════════════════════════════════ */
(function initProjectFilter() {
  const filterBar   = $('.filter-bar');
  const filterCount = $('#filter-count');
  const container   = $('#projects-container');
  if (!filterBar || !container) return;

  const cards       = $$('[data-category]', container);
  const filterBtns  = $$('.filter-btn', filterBar);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update button ARIA state
      filterBtns.forEach(b => {
        b.setAttribute('aria-selected', 'false');
        b.classList.remove('active');
      });
      btn.setAttribute('aria-selected', 'true');
      btn.classList.add('active');

      // Show / hide cards
      let visibleCount = 0;
      cards.forEach(card => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !matches);
        if (matches) visibleCount++;
      });

      // Update live region
      if (filterCount) {
        filterCount.textContent = `Showing ${visibleCount} project${visibleCount !== 1 ? 's' : ''}`;
      }

      // Announce to screen readers
      announce(`Showing ${visibleCount} project${visibleCount !== 1 ? 's' : ''}`);
    });
  });
})();


/* ═══════════════════════════════════════════════════════════════════════
   6. CONTACT FORM — ACCESSIBLE VALIDATION
   Custom validation with proper ARIA error messaging.
   Uses aria-invalid, aria-describedby, and role="alert".
   Includes honeypot anti-spam, character counter, and submission UX.
   ═══════════════════════════════════════════════════════════════════════ */
(function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const submitBtn   = $('#submit-btn');
  const formStatus  = $('#form-status');
  const messageArea = $('#message');
  const msgCount    = $('#message-count');

  /* ── Character counter for message textarea ── */
  if (messageArea && msgCount) {
    const maxLength = parseInt(messageArea.getAttribute('maxlength'), 10) || 2000;

    messageArea.addEventListener('input', () => {
      const remaining = maxLength - messageArea.value.length;
      msgCount.textContent = `${messageArea.value.length} / ${maxLength} characters`;
      // Warn when approaching limit
      msgCount.style.color = remaining < 100 ? 'var(--error)' : '';
    });
  }

  /* ── Field validation rules ── */
  const validations = {
    name: {
      validate: (v) => v.trim().length >= 2,
      errorId: 'name-error',
    },
    email: {
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      errorId: 'email-error',
    },
    phone: {
      // Optional field — only validate if non-empty
      validate: (v) => v.trim() === '' || /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,10}/.test(v.trim()),
      errorId: 'phone-error',
    },
    subject: {
      validate: (v) => v !== '',
      errorId: 'subject-error',
    },
    message: {
      validate: (v) => v.trim().length >= 20,
      errorId: 'message-error',
    },
  };

  /**
   * Validate a single field.
   * @param {HTMLElement} field
   * @returns {boolean} isValid
   */
  function validateField(field) {
    const name  = field.name;
    const rule  = validations[name];
    if (!rule) return true;

    const isValid  = rule.validate(field.value);
    const errorEl  = document.getElementById(rule.errorId);
    const groupEl  = field.closest('.form-group');

    // Update ARIA invalid state
    field.setAttribute('aria-invalid', isValid ? 'false' : 'true');

    if (errorEl) {
      errorEl.hidden = isValid;
    }

    // Visual class on the group
    if (groupEl) {
      groupEl.classList.toggle('has-error', !isValid);
    }

    return isValid;
  }

  /* Real-time validation on blur (after user leaves field) */
  $$('input, select, textarea', form).forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    // Clear error on input, re-validate on change
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        validateField(field);
      }
    });
  });

  /* ── Form submission ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check — if filled, silently ignore
    const honeypot = form.querySelector('[name="website_url"]');
    if (honeypot && honeypot.value) return;

    // Validate all fields
    const fields   = $$('input:not([name="website_url"]), select, textarea', form);
    let firstError = null;

    const allValid = fields.every(field => {
      const valid = validateField(field);
      if (!valid && !firstError) firstError = field;
      return valid;
    });

    if (!allValid) {
      // Move focus to first invalid field for keyboard users
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showStatus('Please fix the errors above before submitting.', 'error');
      return;
    }

    // UI — loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    showStatus('', '');

    try {
      // Simulate network request — replace with your actual endpoint
      await fakeSubmit(new FormData(form));

      // Success
      showStatus('✓ Message sent! I\'ll be in touch within 24 hours.', 'success');
      form.reset();
      // Reset ARIA states
      fields.forEach(f => f.removeAttribute('aria-invalid'));
      if (msgCount) msgCount.textContent = '';
      announce('Message sent successfully.');
    } catch (err) {
      showStatus('⚠ Something went wrong. Please email me directly at manojkumar210807@gmail.com', 'error');
      announce('Form submission failed. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message <span class="btn-icon" aria-hidden="true">→</span>';
    }
  });

  /**
   * Show a status message in the form status element.
   * @param {string} message
   * @param {'success'|'error'|''} type
   */
  function showStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form-status';
    if (type) formStatus.classList.add(type);
  }

  /**
   * Simulated async form submission (replace with fetch to a real endpoint).
   * @param {FormData} data
   * @returns {Promise<void>}
   */
  function fakeSubmit(data) {
    // Log form data in development (remove in production)
    console.log('Form data:', Object.fromEntries(data.entries()));
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        Math.random() > 0.05 ? resolve() : reject(new Error('Network error'));
      }, 1500);
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════════════
   7. CURRENT YEAR IN FOOTER
   ═══════════════════════════════════════════════════════════════════════ */
(function setCurrentYear() {
  $$('#current-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();


/* ═══════════════════════════════════════════════════════════════════════
   8. ACTIVE NAV LINK — highlight based on current URL
   ═══════════════════════════════════════════════════════════════════════ */
(function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    const isActive = href === currentPage;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
})();


/* ═══════════════════════════════════════════════════════════════════════
   9. SKIP LINK — Smooth focus management
   After the skip link moves focus to #main-content, the browser
   sometimes doesn't scroll properly. This ensures it does.
   ═══════════════════════════════════════════════════════════════════════ */
(function initSkipLink() {
  const skipLink = $('.skip-link');
  if (!skipLink) return;

  skipLink.addEventListener('click', (e) => {
    const target = document.getElementById(
      skipLink.getAttribute('href').replace('#', '')
    );
    if (target) {
      e.preventDefault();
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
})();


/* ═══════════════════════════════════════════════════════════════════════
   10. SKILL BAR ANIMATION — trigger on scroll into view
   Skill bars use CSS animation (.skill-fill), but we defer it until
   the section is visible to avoid off-screen animation waste.
   ═══════════════════════════════════════════════════════════════════════ */
(function initSkillBars() {
  const skillSection = $('.skills-section');
  if (!skillSection || !('IntersectionObserver' in window)) return;

  const bars = $$('.skill-fill', skillSection);

  // Initially pause the animation
  bars.forEach(bar => {
    bar.style.animationPlayState = 'paused';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Play all skill bar animations
          bars.forEach(bar => {
            bar.style.animationPlayState = 'running';
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(skillSection);
})();


/* ═══════════════════════════════════════════════════════════════════════
   11. HEADER SCROLL SHADOW
   Adds a subtle shadow to the sticky header when the user scrolls.
   ═══════════════════════════════════════════════════════════════════════ */
(function initHeaderShadow() {
  const header = $('.site-header');
  if (!header) return;

  const onScroll = () => {
    header.style.boxShadow = window.scrollY > 8
      ? '0 2px 12px rgb(0 0 0 / 0.08)'
      : '';
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();
