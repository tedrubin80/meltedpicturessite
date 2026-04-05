/**
 * Authentication Middleware
 */

// Check if user is authenticated
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Check if user has admin role
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
}

// Add user info to request if authenticated
function loadUser(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  loadUser,
};
