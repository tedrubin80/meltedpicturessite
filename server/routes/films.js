/**
 * Films API Routes
 */

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Get all films (public - only published)
router.get('/public', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, slug, synopsis, youtube_id, year, genre, duration,
              rating, poster_url, backdrop_url, featured, tags
       FROM films
       WHERE status = 'published'
       ORDER BY featured DESC, created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching public films:', error);
    res.status(500).json({ error: 'Failed to fetch films' });
  }
});

// Get single film by slug (public)
router.get('/public/:slug', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, slug, synopsis, full_description, youtube_id, year,
              genre, duration, rating, release_date, director, writer, credits,
              poster_url, backdrop_url, tags
       FROM films
       WHERE slug = $1 AND status = 'published'`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film not found' });
    }

    // Increment view count
    await db.query(
      'UPDATE films SET view_count = view_count + 1 WHERE slug = $1',
      [req.params.slug]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching film:', error);
    res.status(500).json({ error: 'Failed to fetch film' });
  }
});

// ============================================
// Admin Routes (require authentication)
// ============================================

// Get all films (admin - all statuses)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, genre, search } = req.query;

    let query = `
      SELECT id, title, slug, synopsis, youtube_id, year, genre, duration,
             rating, poster_url, status, featured, view_count, created_at, updated_at
      FROM films
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (genre && genre !== 'all') {
      params.push(`%${genre}%`);
      query += ` AND genre ILIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR synopsis ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching films:', error);
    res.status(500).json({ error: 'Failed to fetch films' });
  }
});

// Get single film by ID (admin)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM films WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching film:', error);
    res.status(500).json({ error: 'Failed to fetch film' });
  }
});

// Create film
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, synopsis, full_description, youtube_id, year, genre,
      duration, rating, release_date, director, writer, credits,
      poster_url, backdrop_url, tags, status, featured
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const slug = generateSlug(title);

    // Check for duplicate slug
    const existing = await db.query(
      'SELECT id FROM films WHERE slug = $1',
      [slug]
    );

    let finalSlug = slug;
    if (existing.rows.length > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const result = await db.query(
      `INSERT INTO films (
        title, slug, synopsis, full_description, youtube_id, year, genre,
        duration, rating, release_date, director, writer, credits,
        poster_url, backdrop_url, tags, status, featured, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        title, finalSlug, synopsis, full_description, youtube_id, year, genre,
        duration, rating, release_date || null, director || 'Melted Pictures',
        writer || 'Melted Pictures', credits, poster_url, backdrop_url, tags,
        status || 'draft', featured || false, req.session.user.id
      ]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.user.id, 'create', 'film', result.rows[0].id, JSON.stringify({ title })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating film:', error);
    res.status(500).json({ error: 'Failed to create film' });
  }
});

// Update film
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, synopsis, full_description, youtube_id, year, genre,
      duration, rating, release_date, director, writer, credits,
      poster_url, backdrop_url, tags, status, featured
    } = req.body;

    // Check film exists
    const existing = await db.query('SELECT id, title FROM films WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Film not found' });
    }

    // Update slug if title changed
    let slug;
    if (title && title !== existing.rows[0].title) {
      slug = generateSlug(title);
      const slugExists = await db.query(
        'SELECT id FROM films WHERE slug = $1 AND id != $2',
        [slug, id]
      );
      if (slugExists.rows.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const result = await db.query(
      `UPDATE films SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        synopsis = COALESCE($3, synopsis),
        full_description = COALESCE($4, full_description),
        youtube_id = COALESCE($5, youtube_id),
        year = COALESCE($6, year),
        genre = COALESCE($7, genre),
        duration = COALESCE($8, duration),
        rating = COALESCE($9, rating),
        release_date = $10,
        director = COALESCE($11, director),
        writer = COALESCE($12, writer),
        credits = COALESCE($13, credits),
        poster_url = $14,
        backdrop_url = $15,
        tags = COALESCE($16, tags),
        status = COALESCE($17, status),
        featured = COALESCE($18, featured)
      WHERE id = $19
      RETURNING *`,
      [
        title, slug, synopsis, full_description, youtube_id, year, genre,
        duration, rating, release_date || null, director, writer, credits,
        poster_url, backdrop_url, tags, status, featured, id
      ]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.user.id, 'update', 'film', id, JSON.stringify({ title: title || existing.rows[0].title })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating film:', error);
    res.status(500).json({ error: 'Failed to update film' });
  }
});

// Delete film
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT title FROM films WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Film not found' });
    }

    await db.query('DELETE FROM films WHERE id = $1', [id]);

    // Log activity
    await db.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.user.id, 'delete', 'film', id, JSON.stringify({ title: existing.rows[0].title })]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting film:', error);
    res.status(500).json({ error: 'Failed to delete film' });
  }
});

// Get dashboard stats
router.get('/stats/dashboard', requireAuth, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE status = 'draft') as drafts,
        COUNT(*) FILTER (WHERE featured = true) as featured,
        COALESCE(SUM(view_count), 0) as total_views
      FROM films
    `);

    const recent = await db.query(`
      SELECT id, title, status, genre, created_at
      FROM films
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      stats: stats.rows[0],
      recentFilms: recent.rows,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
