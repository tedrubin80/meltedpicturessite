/**
 * Newsletter subscription — proxies to Listmonk.
 * Distinct from the contact inquiry form.
 *
 * Prefers LISTMONK_LIST_UUID → POST /api/public/subscription (double opt-in friendly).
 * Falls back to LISTMONK_LIST_ID → POST /api/subscribers (authenticated).
 */

const express = require('express');
const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function listUuid() {
  const uuid = (process.env.LISTMONK_LIST_UUID || '').trim();
  return UUID_RE.test(uuid) ? uuid : null;
}

function listId() {
  const id = parseInt(process.env.LISTMONK_LIST_ID, 10);
  return Number.isFinite(id) ? id : null;
}

function listmonkConfigured() {
  if (!process.env.LISTMONK_URL) return false;
  if (listUuid()) return true;
  return Boolean(
    process.env.LISTMONK_API_USER &&
    process.env.LISTMONK_API_TOKEN &&
    listId()
  );
}

function listmonkAuthHeader() {
  const user = process.env.LISTMONK_API_USER;
  const token = process.env.LISTMONK_API_TOKEN;
  return `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`;
}

function baseUrl() {
  return process.env.LISTMONK_URL.replace(/\/$/, '');
}

async function subscribeViaPublicUuid(email, name, uuid) {
  const response = await fetch(`${baseUrl()}/api/public/subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name,
      list_uuids: [uuid],
    }),
  });
  return response;
}

async function subscribeViaApiListId(email, name, id) {
  const response = await fetch(`${baseUrl()}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: listmonkAuthHeader(),
    },
    body: JSON.stringify({
      email,
      name,
      status: 'enabled',
      lists: [id],
      // Leave false so Listmonk double opt-in lists send confirmation email
      preconfirm_subscriptions: false,
    }),
  });
  return response;
}

/**
 * POST /
 * Body: { email, name?, website? } — website is honeypot
 */
router.post('/', async (req, res) => {
  try {
    const { email, name, website } = req.body || {};

    // Honeypot: bots fill hidden fields; pretend success
    if (website) {
      return res.json({
        success: true,
        message: 'Thanks — check your inbox to confirm your subscription.',
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (!listmonkConfigured()) {
      console.error('Listmonk env vars not configured');
      return res.status(503).json({
        error: 'Newsletter signup is temporarily unavailable',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (typeof name === 'string' && name.trim())
      ? name.trim()
      : cleanEmail.split('@')[0];

    const uuid = listUuid();
    const id = listId();

    let response;
    if (uuid) {
      response = await subscribeViaPublicUuid(cleanEmail, cleanName, uuid);
    } else {
      response = await subscribeViaApiListId(cleanEmail, cleanName, id);
    }

    if (response.ok) {
      return res.json({
        success: true,
        message: 'Thanks — check your inbox to confirm your subscription.',
      });
    }

    // Already subscribed (or email exists) — treat as success for privacy/UX
    if (response.status === 409) {
      return res.json({
        success: true,
        message: 'You are already on the list. Watch your inbox for updates.',
      });
    }

    const errBody = await response.text();
    console.error('Listmonk subscribe failed:', response.status, errBody);
    return res.status(502).json({
      error: 'Could not complete subscription. Please try again later.',
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
