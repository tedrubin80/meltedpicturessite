/**
 * Melted Pictures - Express Server
 * Main entry point for the backend API
 */

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const db = require('./db');
const { loadUser } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const filmsRoutes = require('./routes/films');
const settingsRoutes = require('./routes/settings');
const pagesRoutes = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for nginx
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["https://www.youtube.com", "https://youtube.com"],
    },
  },
}));

// CORS for API access
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN
    : true,
  credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login attempts
  message: { error: 'Too many login attempts, please try again later' },
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'melted-pictures-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
  name: 'mp.sid',
}));

// Load user middleware
app.use(loadUser);

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/films', apiLimiter, filmsRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dynamic pages (film detail pages)
app.use('/', pagesRoutes);

// Admin SPA - serve admin index for all admin routes
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Frontend routes - serve index.html for SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Catch-all for frontend routes
app.get('*', (req, res) => {
  // Check if it's a static file request
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🎬 Melted Pictures Server');
  console.log('═══════════════════════════════════════════');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Server:      http://localhost:${PORT}`);
  console.log(`   Admin:       http://localhost:${PORT}/admin`);
  console.log(`   API:         http://localhost:${PORT}/api`);
  console.log('═══════════════════════════════════════════');
  console.log('');
});

module.exports = app;
