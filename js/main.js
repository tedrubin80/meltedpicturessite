/**
 * Melted Pictures - Main JavaScript
 * Dark cinematic horror film website
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Header scroll effect
  const header = document.querySelector('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });

  // Intersection Observer for fade-in animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all fade-in elements
  document.querySelectorAll('.fade-in').forEach(el => {
    fadeInObserver.observe(el);
  });

  // Film filter functionality
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      // Re-query so dynamically loaded film cards are included
      document.querySelectorAll('.film-card[data-genre]').forEach(card => {
        const genres = (card.dataset.genre || '').toLowerCase().replace(/-/g, '');

        if (filter === 'all' || genres.includes(filter)) {
          card.style.display = '';
          card.classList.add('visible');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Contact inquiry form → /api/contact (admin inbox)
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    const statusEl = contactForm.querySelector('.contact-form-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const payload = {
        name: (formData.get('name') || '').toString().trim(),
        email: (formData.get('email') || '').toString().trim(),
        subject: (formData.get('subject') || '').toString().trim(),
        message: (formData.get('message') || '').toString().trim(),
        website: (formData.get('website') || '').toString(),
      };

      if (statusEl) {
        statusEl.hidden = true;
        statusEl.classList.remove('is-success', 'is-error');
      }

      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (statusEl) {
          statusEl.hidden = false;
          if (res.ok && data.success) {
            statusEl.classList.add('is-success');
            statusEl.textContent = data.message || "Thanks — we'll get back to you soon.";
            contactForm.reset();
          } else {
            statusEl.classList.add('is-error');
            statusEl.textContent = data.error || 'Could not send message. Please try again.';
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.classList.add('is-error');
          statusEl.textContent = 'Could not reach the server. Please try again.';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Newsletter → Listmonk (via /api/subscribe proxy)
  const newsletterForm = document.querySelector('.newsletter-form');

  if (newsletterForm) {
    const statusEl = newsletterForm.querySelector('.newsletter-status');
    const submitBtn = newsletterForm.querySelector('button[type="submit"]');

    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(newsletterForm);
      const email = (formData.get('email') || '').toString().trim();
      const website = (formData.get('website') || '').toString();

      if (statusEl) {
        statusEl.hidden = true;
        statusEl.classList.remove('is-success', 'is-error');
      }

      if (!email) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.classList.add('is-error');
          statusEl.textContent = 'Enter a valid email address.';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
      }

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, website }),
        });

        const data = await res.json().catch(() => ({}));

        if (statusEl) {
          statusEl.hidden = false;
          if (res.ok && data.success) {
            statusEl.classList.add('is-success');
            statusEl.textContent = data.message || 'Thanks — check your inbox to confirm.';
            newsletterForm.reset();
          } else {
            statusEl.classList.add('is-error');
            statusEl.textContent = data.error || 'Something went wrong. Please try again.';
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.classList.add('is-error');
          statusEl.textContent = 'Could not reach the server. Please try again.';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  }

  // Lazy loading for images (native + fallback)
  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for older browsers
    const lazyImages = document.querySelectorAll('img[data-src]');

    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          lazyImageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => lazyImageObserver.observe(img));
  }

  // Add parallax effect to hero sections
  const heroSections = document.querySelectorAll('.hero-bg, .film-hero-bg, .featured-film-bg');

  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;

    heroSections.forEach(hero => {
      const rate = scrolled * 0.3;
      hero.style.transform = `translateY(${rate}px)`;
    });
  });

  // Video play tracking (for analytics)
  const videoIframes = document.querySelectorAll('.video-container iframe');

  videoIframes.forEach(iframe => {
    // Enable JS API for YouTube
    const src = iframe.src;
    if (src.includes('youtube.com') && !src.includes('enablejsapi')) {
      iframe.src = src + (src.includes('?') ? '&' : '?') + 'enablejsapi=1';
    }
  });

  // Preload critical images on hover
  document.querySelectorAll('.film-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const href = card.getAttribute('href');
      if (href) {
        // Preload the page
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  });

  console.log('Melted Pictures - Where AI Meets Nightmare');
});
