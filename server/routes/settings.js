/**
 * Settings API Routes
 */

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all settings (public - for frontend)
router.get('/public', async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get all settings (admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT key, value, updated_at FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', requireAuth, async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_log (user_id, action, entity_type, details)
       VALUES ($1, $2, $3, $4)`,
      [req.session.user.id, 'update', 'settings', JSON.stringify({ keys: Object.keys(settings) })]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get activity log (admin)
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.id, a.action, a.entity_type, a.entity_id, a.details,
        a.ip_address, a.created_at, u.name as user_name, u.email as user_email
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

module.exports = router;
