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
  const filmCards = document.querySelectorAll('.film-card[data-genre]');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      filmCards.forEach(card => {
        const genres = card.dataset.genre || '';

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

  // Contact form handling (basic)
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      // Here you would typically send to a backend
      // For now, show a success message
      alert('Thank you for your message! We\'ll get back to you soon.');
      contactForm.reset();
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
