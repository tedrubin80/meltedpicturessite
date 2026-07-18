/**
 * Dynamic Page Routes
 * Serves film pages with data from database
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

// Film detail page
router.get('/film/:slug', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM films WHERE slug = $1 AND status = 'published'`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Film not found');
    }

    const film = result.rows[0];

    // Increment view count
    await db.query(
      'UPDATE films SET view_count = view_count + 1 WHERE id = $1',
      [film.id]
    );

    // Generate film page HTML
    const html = generateFilmPage(film);
    res.send(html);

  } catch (error) {
    console.error('Film page error:', error);
    res.status(500).send('Error loading film');
  }
});

function generateFilmPage(film) {
  const releaseDate = film.release_date
    ? new Date(film.release_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const genre = film.genre
    ? film.genre.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(film.title)} | Melted Pictures</title>
  <meta name="description" content="${escapeHtml(film.synopsis || '')}">
  <meta property="og:title" content="${escapeHtml(film.title)} | Melted Pictures">
  <meta property="og:description" content="${escapeHtml(film.synopsis || '')}">
  ${film.poster_url ? `<meta property="og:image" content="${escapeHtml(film.poster_url)}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/" class="logo">Melted<span>Pictures</span></a>
      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/films.html" class="active">Films</a></li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/contact.html">Contact</a></li>
      </ul>
      <div class="menu-toggle">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </nav>
  </header>

  <section class="film-hero">
    <div class="film-hero-bg">
      ${film.backdrop_url
        ? `<img src="${escapeHtml(film.backdrop_url)}" alt="${escapeHtml(film.title)}">`
        : film.poster_url
          ? `<img src="${escapeHtml(film.poster_url)}" alt="${escapeHtml(film.title)}" style="filter: blur(30px) brightness(0.3); transform: scale(1.2);">`
          : ''}
    </div>
    <div class="container">
      <div class="film-info">
        <div class="film-poster fade-in">
          ${film.poster_url ? `<img src="${escapeHtml(film.poster_url)}" alt="${escapeHtml(film.title)} Poster">` : ''}
        </div>
        <div class="film-details fade-in">
          <span class="ai-badge">AI Generated</span>
          <h1>${escapeHtml(film.title)}</h1>
          <div class="film-meta">
            <span class="year">${film.year || ''}</span>
            <span>${genre}</span>
            ${film.duration ? `<span>${escapeHtml(film.duration)}</span>` : ''}
            ${film.rating ? `<span class="rating">${escapeHtml(film.rating)}</span>` : ''}
          </div>
          <p class="film-synopsis">${escapeHtml(film.synopsis || '')}</p>
          <div style="margin-top: 2rem;">
            <a href="#watch" class="btn btn-primary">Watch Film</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="watch" class="video-section">
    <div class="container">
      <div class="section-header" style="justify-content: center; text-align: center;">
        <h2>Watch Now</h2>
      </div>
      <div class="video-container fade-in">
        <iframe
          src="https://www.youtube.com/embed/${escapeHtml(film.youtube_id || '')}?rel=0&modestbranding=1"
          title="${escapeHtml(film.title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    </div>
  </section>

  ${film.full_description ? `
  <section class="container" style="padding: 4rem 0;">
    <div class="section-header">
      <h2>About the Film</h2>
    </div>
    <p style="color: var(--text-secondary); max-width: 800px; line-height: 1.8; font-size: 1.1rem;">${escapeHtml(film.full_description)}</p>
  </section>
  ` : ''}

  <section class="container">
    <div class="section-header">
      <h2>Credits</h2>
    </div>
    <div class="credits-grid fade-in">
      <div class="credit-item">
        <h4>Directed By</h4>
        <p>${escapeHtml(film.director || 'Melted Pictures')}</p>
      </div>
      <div class="credit-item">
        <h4>Written By</h4>
        <p>${escapeHtml(film.writer || 'Melted Pictures')}</p>
      </div>
      <div class="credit-item">
        <h4>AI Generation</h4>
        <p>Multiple AI Models</p>
      </div>
      ${releaseDate ? `
      <div class="credit-item">
        <h4>Release Date</h4>
        <p>${releaseDate}</p>
      </div>
      ` : ''}
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <a href="/" class="logo">Melted<span>Pictures</span></a>
          <p data-setting-text="site_description">Pioneering AI-generated horror and thriller cinema.</p>
          <div class="social-links">
            <a href="#" data-setting-href="youtube_url" aria-label="YouTube">YT</a>
            <a href="#" data-setting-href="twitter_url" aria-label="Twitter">X</a>
            <a href="#" data-setting-href="instagram_url" aria-label="Instagram">IG</a>
            <a href="#" data-setting-href="tiktok_url" aria-label="TikTok">TT</a>
          </div>
        </div>
        <div class="footer-links">
          <h4>Navigate</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/films.html">Films</a></li>
            <li><a href="/about.html">About</a></li>
            <li><a href="/contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-newsletter">
          <h4>Newsletter</h4>
          <p>New films and studio updates. Unsubscribe anytime.</p>
          <form class="newsletter-form" action="/api/subscribe" method="POST" novalidate>
            <input type="text" name="website" class="newsletter-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
            <label class="visually-hidden" for="newsletter-email">Email</label>
            <div class="newsletter-row">
              <input type="email" id="newsletter-email" name="email" required placeholder="you@email.com" autocomplete="email">
              <button type="submit" class="btn btn-primary">Subscribe</button>
            </div>
            <p class="newsletter-status" role="status" aria-live="polite" hidden></p>
          </form>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 Melted Pictures. All rights reserved.</p>
        <p>AI-Powered Horror Cinema</p>
      </div>
    </div>
  </footer>

  <script src="/js/site-settings.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
