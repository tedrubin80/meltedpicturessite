/**
 * Films Loader - Dynamically loads films from API
 */

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  loadPublicFilms();
});

async function loadPublicFilms() {
  try {
    const res = await fetch(`${API_BASE}/films/public`);
    if (!res.ok) return;

    const films = await res.json();

    // Load films grid if on films page
    const filmsGrid = document.getElementById('dynamic-films-grid');
    const staticGrid = document.getElementById('static-films-grid');
    if (filmsGrid && films.length > 0) {
      renderFilmsGrid(filmsGrid, films);
      if (staticGrid) staticGrid.hidden = true;
    }

    // Load featured film if on home page
    const featuredContainer = document.getElementById('featured-film-container');
    if (featuredContainer) {
      const featured = films.find(f => f.featured) || films[0];
      if (featured) {
        renderFeaturedFilm(featuredContainer, featured);
      }
    }

    // Load home page film grid
    const homeGrid = document.getElementById('home-films-grid')
      || document.querySelector('.films-grid:not(#dynamic-films-grid):not(#static-films-grid)');
    if (homeGrid && films.length > 0) {
      renderFilmsGrid(homeGrid, films.slice(0, 4));
    }

    // Footer film shortcuts (published films only)
    const footerFilms = document.getElementById('footer-films-list');
    if (footerFilms && films.length > 0) {
      footerFilms.innerHTML = films.slice(0, 4).map(film => `
        <li><a href="/film/${escapeHtml(film.slug)}">${escapeHtml(film.title)}</a></li>
      `).join('');
    }

  } catch (error) {
    console.log('Films API not available, using static content');
  }
}

function renderFilmsGrid(container, films) {
  container.innerHTML = films.map(film => `
    <a href="/film/${film.slug}" class="film-card fade-in visible" data-genre="${film.genre || ''}">
      ${film.poster_url
        ? `<img src="${escapeHtml(film.poster_url)}" alt="${escapeHtml(film.title)}">`
        : '<div style="background: #161616; width: 100%; height: 100%;"></div>'}
      <div class="film-card-overlay">
        <span class="ai-badge">AI Generated</span>
        <h3>${escapeHtml(film.title)}</h3>
        <span class="year">${film.year || ''}</span>
        <span class="genre">${formatGenre(film.genre)}</span>
      </div>
    </a>
  `).join('');
}

function renderFeaturedFilm(container, film) {
  container.innerHTML = `
    <div class="featured-film-bg">
      ${film.backdrop_url
        ? `<img src="${escapeHtml(film.backdrop_url)}" alt="${escapeHtml(film.title)}">`
        : film.poster_url
          ? `<img src="${escapeHtml(film.poster_url)}" alt="${escapeHtml(film.title)}" style="filter: blur(20px) brightness(0.3);">`
          : ''}
    </div>
    <div class="container">
      <div class="featured-content fade-in visible">
        <span class="featured-label">Latest Release</span>
        <span class="ai-badge">AI Generated</span>
        <h2>${escapeHtml(film.title)}</h2>
        <p>${escapeHtml(film.synopsis || '')}</p>
        <a href="/film/${film.slug}" class="btn btn-outline">Watch Now</a>
      </div>
    </div>
  `;
}

function formatGenre(genre) {
  if (!genre) return '';
  return genre
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
