/**
 * Applies public /api/settings to the live site.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
});

async function loadSiteSettings() {
  try {
    const res = await fetch('/api/settings/public');
    if (!res.ok) return;
    const settings = await res.json();
    applySiteSettings(settings);
  } catch (err) {
    // Keep static HTML fallbacks
  }
}

function applySiteSettings(settings) {
  document.querySelectorAll('[data-setting-text]').forEach((el) => {
    const key = el.getAttribute('data-setting-text');
    const value = settings[key];
    if (value) el.textContent = value;
  });

  document.querySelectorAll('[data-setting-html]').forEach((el) => {
    const key = el.getAttribute('data-setting-html');
    const value = settings[key];
    if (value) {
      // Allow simple line breaks only — escape otherwise
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-setting-mailto]').forEach((el) => {
    const key = el.getAttribute('data-setting-mailto');
    const value = settings[key];
    if (!value) return;
    el.href = `mailto:${value}`;
    el.textContent = value;
  });

  document.querySelectorAll('[data-setting-href]').forEach((el) => {
    const key = el.getAttribute('data-setting-href');
    const value = (settings[key] || '').trim();
    if (value) {
      el.href = value;
      el.hidden = false;
      el.removeAttribute('aria-hidden');
      el.style.display = '';
    } else {
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';
    }
  });

  injectPlausible(settings.plausible_domain);
}

function injectPlausible(domain) {
  const existing = document.getElementById('plausible-script');
  if (existing) existing.remove();

  const clean = (domain || '').trim();
  if (!clean) return;

  // Basic domain validation — no protocol or paths
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean)) return;

  const script = document.createElement('script');
  script.id = 'plausible-script';
  script.defer = true;
  script.dataset.domain = clean;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}
