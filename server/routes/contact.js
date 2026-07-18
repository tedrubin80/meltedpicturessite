/**
 * Contact inquiry form — stores messages for admin inbox.
 * Distinct from newsletter (Listmonk) subscription.
 */

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST / — public contact form submit
 * Body: { name, email, subject, message, website? }
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, website } = req.body || {};

    // Honeypot
    if (website) {
      return res.json({
        success: true,
        message: "Thanks — we'll get back to you soon.",
      });
    }

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (!cleanName || cleanName.length > 200) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!cleanSubject || cleanSubject.length > 300) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    if (!cleanMessage || cleanMessage.length > 10000) {
      return res.status(400).json({ error: 'Message is required' });
    }

    await db.query(
      `INSERT INTO contact_messages (name, email, subject, message, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        cleanName,
        cleanEmail,
        cleanSubject,
        cleanMessage,
        req.ip || null,
      ]
    );

    return res.json({
      success: true,
      message: "Thanks — we'll get back to you soon.",
    });
  } catch (err) {
    console.error('Contact submit error:', err);
    return res.status(500).json({ error: 'Could not send message. Please try again.' });
  }
});

/** GET / — admin list */
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, subject, message, read, created_at
       FROM contact_messages
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Contact list error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

/** GET /unread-count — admin badge */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*)::int AS count FROM contact_messages WHERE read = FALSE`
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error('Contact unread count error:', err);
    res.status(500).json({ error: 'Failed to load count' });
  }
});

/** PATCH /:id/read — mark read/unread */
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const read = req.body?.read !== false;
    const result = await db.query(
      `UPDATE contact_messages SET read = $1 WHERE id = $2
       RETURNING id, read`,
      [read, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Contact mark read error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

/** DELETE /:id */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Contact delete error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
