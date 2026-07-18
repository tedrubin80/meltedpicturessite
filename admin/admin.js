/**
 * Melted Pictures Admin Panel
 * API-based film management system
 */

const API_BASE = '/api';

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initLoginForm();
  initNavigation();
  initFilmForm();
  initPosterPreview();
  initImageUploads();
});

// ============================================
// Authentication
// ============================================

async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      showAdminApp(data.user);
    } else {
      showLoginScreen();
    }
  } catch (error) {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display = 'none';
}

function showAdminApp(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'grid';
  document.getElementById('user-name').textContent = user.name || user.email;

  // Load initial data
  loadDashboard();
  loadSettings();
  loadUnreadCount();
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        errorDiv.textContent = '';
        showAdminApp(data.user);
      } else {
        errorDiv.textContent = data.error || 'Login failed';
      }
    } catch (error) {
      errorDiv.textContent = 'Connection error. Please try again.';
    }
  });
}

async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  showLoginScreen();
}

async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword || !newPassword) {
    showToast('Please fill in all password fields', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast('Password updated successfully', 'success');
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
    } else {
      showToast(data.error || 'Failed to update password', 'error');
    }
  } catch (error) {
    showToast('Connection error', 'error');
  }
}

// ============================================
// Navigation
// ============================================

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      showSection(section);
    });
  });
}

function showSection(sectionId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });

  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
  });

  window.location.hash = sectionId;

  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'films') loadFilmsList();
  if (sectionId === 'messages') loadMessages();
  if (sectionId === 'add-film' && !document.getElementById('film-id').value) {
    resetForm();
  }
}

// ============================================
// Contact Messages
// ============================================

async function loadUnreadCount() {
  try {
    const res = await fetch(`${API_BASE}/contact/unread-count`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    const badge = document.getElementById('messages-badge');
    if (!badge) return;
    if (data.count > 0) {
      badge.hidden = false;
      badge.textContent = String(data.count);
    } else {
      badge.hidden = true;
    }
  } catch (err) {
    // ignore
  }
}

async function loadMessages() {
  const container = document.getElementById('messages-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/contact`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load messages');
    const messages = await res.json();
    loadUnreadCount();

    if (!messages.length) {
      container.innerHTML = '<p class="empty-state">No messages yet.</p>';
      return;
    }

    container.innerHTML = messages.map((m) => `
      <article class="message-card ${m.read ? 'is-read' : 'is-unread'}" data-id="${m.id}">
        <div class="message-meta">
          <strong>${escapeHtml(m.name)}</strong>
          <a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a>
          <time>${new Date(m.created_at).toLocaleString()}</time>
        </div>
        <h3>${escapeHtml(m.subject)}</h3>
        <p class="message-body">${escapeHtml(m.message)}</p>
        <div class="message-actions">
          ${m.read
            ? `<button class="btn btn-outline" onclick="toggleMessageRead('${m.id}', false)">Mark unread</button>`
            : `<button class="btn btn-primary" onclick="toggleMessageRead('${m.id}', true)">Mark read</button>`}
          <button class="btn btn-danger" onclick="deleteMessage('${m.id}')">Delete</button>
        </div>
      </article>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Could not load messages.</p>';
  }
}

async function toggleMessageRead(id, read) {
  try {
    const res = await fetch(`${API_BASE}/contact/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ read }),
    });
    if (res.ok) {
      loadMessages();
    } else {
      showToast('Failed to update message', 'error');
    }
  } catch (err) {
    showToast('Connection error', 'error');
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    const res = await fetch(`${API_BASE}/contact/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      showToast('Message deleted', 'success');
      loadMessages();
    } else {
      showToast('Failed to delete message', 'error');
    }
  } catch (err) {
    showToast('Connection error', 'error');
  }
}

// ============================================
// Dashboard
// ============================================

async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/films/stats/dashboard`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load dashboard');

    const data = await res.json();

    document.getElementById('total-films').textContent = data.stats.total;
    document.getElementById('published-films').textContent = data.stats.published;
    document.getElementById('draft-films').textContent = data.stats.drafts;
    document.getElementById('total-views').textContent = formatNumber(data.stats.total_views);

    renderRecentFilms(data.recentFilms);
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

function renderRecentFilms(films) {
  const container = document.getElementById('recent-films-list');

  if (!films || films.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">&#9654;</div>
        <h3>No films yet</h3>
        <p>Add your first film to get started</p>
        <button class="btn btn-primary" onclick="showSection('add-film')" style="margin-top: 1rem;">Add Film</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="films-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Genre</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${films.map(film => `
          <tr>
            <td><span class="film-title-text">${escapeHtml(film.title)}</span></td>
            <td><span class="status-badge ${film.status}">${film.status}</span></td>
            <td>${formatGenre(film.genre)}</td>
            <td>
              <div class="row-actions">
                <button onclick="editFilm('${film.id}')">Edit</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================
// Films List
// ============================================

async function loadFilmsList() {
  const status = document.getElementById('filter-status')?.value || 'all';
  const genre = document.getElementById('filter-genre')?.value || 'all';
  const search = document.getElementById('search-films')?.value || '';

  try {
    const params = new URLSearchParams();
    if (status !== 'all') params.append('status', status);
    if (genre !== 'all') params.append('genre', genre);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/films?${params}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load films');

    const films = await res.json();
    renderFilmsTable(films);
  } catch (error) {
    console.error('Films list error:', error);
  }
}

function renderFilmsTable(films) {
  const container = document.getElementById('films-list');

  if (!films || films.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">&#9654;</div>
        <h3>No films found</h3>
        <p>Add your first film or adjust your filters</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="films-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Genre</th>
          <th>Year</th>
          <th>Views</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${films.map(film => `
          <tr data-id="${film.id}">
            <td>
              <div class="film-row-title">
                <div class="film-thumb">
                  ${film.poster_url ? `<img src="${escapeHtml(film.poster_url)}" alt="${escapeHtml(film.title)}">` : ''}
                </div>
                <span class="film-title-text">${escapeHtml(film.title)}</span>
                ${film.featured ? '<span class="featured-star">&#9733;</span>' : ''}
              </div>
            </td>
            <td><span class="status-badge ${film.status}">${film.status}</span></td>
            <td>${formatGenre(film.genre)}</td>
            <td>${film.year || '-'}</td>
            <td>${formatNumber(film.view_count || 0)}</td>
            <td>
              <div class="row-actions">
                <button onclick="editFilm('${film.id}')">Edit</button>
                <button onclick="previewFilm('${escapeHtml(film.slug)}')">Preview</button>
                <button class="delete" onclick="confirmDelete('${film.id}', '${escapeHtml(film.title)}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function filterFilms() {
  loadFilmsList();
}

// ============================================
// Film Form
// ============================================

function initFilmForm() {
  const form = document.getElementById('film-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveFilm();
  });
}

function initPosterPreview() {
  document.getElementById('poster').addEventListener('input', (e) => {
    const preview = document.getElementById('poster-preview');
    if (e.target.value) {
      preview.innerHTML = `<img src="${escapeHtml(e.target.value)}" alt="Preview" onerror="this.parentElement.innerHTML=''">`;
    } else {
      preview.innerHTML = '';
    }
  });

  const backdrop = document.getElementById('backdrop');
  if (backdrop) {
    backdrop.addEventListener('input', (e) => {
      const preview = document.getElementById('backdrop-preview');
      if (!preview) return;
      if (e.target.value) {
        preview.innerHTML = `<img src="${escapeHtml(e.target.value)}" alt="Preview" onerror="this.parentElement.innerHTML=''">`;
      } else {
        preview.innerHTML = '';
      }
    });
  }
}

function initImageUploads() {
  const posterFile = document.getElementById('poster-file');
  const backdropFile = document.getElementById('backdrop-file');

  if (posterFile) {
    posterFile.addEventListener('change', async () => {
      if (!posterFile.files?.[0]) return;
      await uploadImageFile(posterFile.files[0], 'poster', 'poster-preview');
      posterFile.value = '';
    });
  }

  if (backdropFile) {
    backdropFile.addEventListener('change', async () => {
      if (!backdropFile.files?.[0]) return;
      await uploadImageFile(backdropFile.files[0], 'backdrop', 'backdrop-preview');
      backdropFile.value = '';
    });
  }
}

async function uploadImageFile(file, inputId, previewId) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    showToast('Uploading image…', 'success');
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    document.getElementById(inputId).value = data.url;
    const preview = document.getElementById(previewId);
    if (preview) {
      preview.innerHTML = `<img src="${escapeHtml(data.url)}" alt="Preview">`;
    }
    showToast('Image uploaded', 'success');
  } catch (err) {
    showToast(err.message || 'Upload failed', 'error');
  }
}

async function saveFilm() {
  const form = document.getElementById('film-form');
  const filmId = document.getElementById('film-id').value;

  const data = {
    title: document.getElementById('title').value,
    synopsis: document.getElementById('synopsis').value,
    youtube_id: document.getElementById('youtube-id').value,
    full_description: document.getElementById('full-description').value,
    director: document.getElementById('director').value,
    writer: document.getElementById('writer').value,
    credits: document.getElementById('credits').value,
    year: parseInt(document.getElementById('year').value),
    genre: document.getElementById('genre').value,
    duration: document.getElementById('duration').value,
    rating: document.getElementById('rating').value,
    release_date: document.getElementById('release-date').value || null,
    poster_url: document.getElementById('poster').value,
    backdrop_url: document.getElementById('backdrop').value,
    tags: document.getElementById('tags').value,
    status: document.getElementById('status').value,
    featured: document.getElementById('featured').checked,
  };

  try {
    const url = filmId ? `${API_BASE}/films/${filmId}` : `${API_BASE}/films`;
    const method = filmId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save film');
    }

    showToast(filmId ? 'Film updated successfully!' : 'Film created successfully!', 'success');
    resetForm();
    showSection('films');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function editFilm(id) {
  try {
    const res = await fetch(`${API_BASE}/films/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load film');

    const film = await res.json();

    document.getElementById('form-title').textContent = 'Edit Film';
    document.getElementById('film-id').value = film.id;
    document.getElementById('title').value = film.title || '';
    document.getElementById('synopsis').value = film.synopsis || '';
    document.getElementById('youtube-id').value = film.youtube_id || '';
    document.getElementById('full-description').value = film.full_description || '';
    document.getElementById('director').value = film.director || 'Melted Pictures';
    document.getElementById('writer').value = film.writer || 'Melted Pictures';
    document.getElementById('credits').value = film.credits || '';
    document.getElementById('year').value = film.year || 2025;
    document.getElementById('genre').value = film.genre || 'horror';
    document.getElementById('duration').value = film.duration || '';
    document.getElementById('rating').value = film.rating || 'TV-MA';
    document.getElementById('release-date').value = film.release_date ? film.release_date.split('T')[0] : '';
    document.getElementById('poster').value = film.poster_url || '';
    document.getElementById('backdrop').value = film.backdrop_url || '';
    document.getElementById('tags').value = film.tags || '';
    document.getElementById('status').value = film.status || 'draft';
    document.getElementById('featured').checked = film.featured || false;

    // Update poster preview
    const preview = document.getElementById('poster-preview');
    if (film.poster_url) {
      preview.innerHTML = `<img src="${escapeHtml(film.poster_url)}" alt="Preview">`;
    } else {
      preview.innerHTML = '';
    }
    const backdropPreview = document.getElementById('backdrop-preview');
    if (backdropPreview) {
      if (film.backdrop_url) {
        backdropPreview.innerHTML = `<img src="${escapeHtml(film.backdrop_url)}" alt="Preview">`;
      } else {
        backdropPreview.innerHTML = '';
      }
    }

    showSection('add-film');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function resetForm() {
  document.getElementById('film-form').reset();
  document.getElementById('form-title').textContent = 'Add New Film';
  document.getElementById('film-id').value = '';
  document.getElementById('poster-preview').innerHTML = '';
  const backdropPreview = document.getElementById('backdrop-preview');
  if (backdropPreview) backdropPreview.innerHTML = '';
  document.getElementById('director').value = 'Melted Pictures';
  document.getElementById('writer').value = 'Melted Pictures';
}

// ============================================
// Preview
// ============================================

function previewFilm(slug) {
  if (!slug) return;
  window.open(`/film/${slug}`, '_blank');
}

// ============================================
// Delete
// ============================================

let filmToDelete = null;

function confirmDelete(id, title) {
  filmToDelete = id;
  document.getElementById('delete-film-title').textContent = title;
  document.getElementById('delete-modal').classList.add('active');

  document.getElementById('confirm-delete').onclick = async () => {
    await deleteFilm(filmToDelete);
    closeModal();
  };
}

async function deleteFilm(id) {
  try {
    const res = await fetch(`${API_BASE}/films/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to delete film');

    showToast('Film deleted', 'success');
    loadFilmsList();
    loadDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function closeModal() {
  document.getElementById('delete-modal').classList.remove('active');
  filmToDelete = null;
}

document.getElementById('delete-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'delete-modal') closeModal();
});

// ============================================
// Settings
// ============================================

async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`, { credentials: 'include' });
    if (!res.ok) return;

    const settings = await res.json();

    if (settings.site_name) document.getElementById('site-name').value = settings.site_name;
    if (settings.site_tagline) document.getElementById('site-tagline').value = settings.site_tagline;
    if (settings.site_description) document.getElementById('site-description').value = settings.site_description;
    if (settings.youtube_url) document.getElementById('youtube-url').value = settings.youtube_url;
    if (settings.twitter_url) document.getElementById('twitter-url').value = settings.twitter_url;
    if (settings.instagram_url) document.getElementById('instagram-url').value = settings.instagram_url;
    if (settings.tiktok_url) document.getElementById('tiktok-url').value = settings.tiktok_url;
    if (settings.contact_email) document.getElementById('contact-email').value = settings.contact_email;
    if (settings.press_email) document.getElementById('press-email').value = settings.press_email;
    if (settings.plausible_domain) document.getElementById('plausible-domain').value = settings.plausible_domain;
  } catch (error) {
    console.error('Settings load error:', error);
  }
}

async function saveSettings() {
  await updateSettings({
    site_name: document.getElementById('site-name').value,
    site_tagline: document.getElementById('site-tagline').value,
    site_description: document.getElementById('site-description').value,
  });
}

async function saveSocialLinks() {
  await updateSettings({
    youtube_url: document.getElementById('youtube-url').value,
    twitter_url: document.getElementById('twitter-url').value,
    instagram_url: document.getElementById('instagram-url').value,
    tiktok_url: document.getElementById('tiktok-url').value,
  });
}

async function saveContact() {
  await updateSettings({
    contact_email: document.getElementById('contact-email').value,
    press_email: document.getElementById('press-email').value,
  });
}

async function saveAnalytics() {
  await updateSettings({
    plausible_domain: document.getElementById('plausible-domain').value.trim(),
  });
}

async function updateSettings(data) {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to save settings');
    showToast('Settings saved!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================
// Export / Import
// ============================================

async function exportData() {
  try {
    const filmsRes = await fetch(`${API_BASE}/films`, { credentials: 'include' });
    const settingsRes = await fetch(`${API_BASE}/settings`, { credentials: 'include' });

    const films = await filmsRes.json();
    const settings = await settingsRes.json();

    const data = {
      films,
      settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `melted-pictures-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Data exported successfully!', 'success');
  } catch (error) {
    showToast('Export failed', 'error');
  }
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.films && Array.isArray(data.films)) {
        for (const film of data.films) {
          delete film.id;
          delete film.created_at;
          delete film.updated_at;
          delete film.created_by;

          await fetch(`${API_BASE}/films`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(film),
          });
        }
      }

      if (data.settings) {
        await fetch(`${API_BASE}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data.settings),
        });
      }

      loadDashboard();
      loadFilmsList();
      loadSettings();
      showToast('Data imported successfully!', 'success');
    } catch (err) {
      showToast('Invalid import file', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// Utilities
// ============================================

function formatGenre(genre) {
  if (!genre) return '-';
  return genre
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
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

// Global exports
window.showSection = showSection;
window.editFilm = editFilm;
window.previewFilm = previewFilm;
window.confirmDelete = confirmDelete;
window.closeModal = closeModal;
window.resetForm = resetForm;
window.exportData = exportData;
window.importData = importData;
window.filterFilms = filterFilms;
window.saveSettings = saveSettings;
window.saveSocialLinks = saveSocialLinks;
window.saveContact = saveContact;
window.saveAnalytics = saveAnalytics;
window.changePassword = changePassword;
window.loadMessages = loadMessages;
window.toggleMessageRead = toggleMessageRead;
window.deleteMessage = deleteMessage;
window.logout = logout;
