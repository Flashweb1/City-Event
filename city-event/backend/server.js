import express from 'express';
import cors from 'cors';
import compression from 'compression';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ical from 'ical-generator';
import * as Sentry from '@sentry/node';
import { validateEventCreation } from './validators.js';
import validateEnvironment from './validateEnv.js';
import RateLimiter from './rateLimiter.js';
import { db, initDB } from './db.js';
import { processTicket, incrementPromoUsage } from './services/ticketService.js';
import { logger, httpLogger } from './logger.js';
import { cacheMiddleware } from './cache.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';

// Validate environment configuration before starting
validateEnvironment();

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
});

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Initialize rate limiters
const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 min
authRateLimiter.cleanup();

const apiRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 min
apiRateLimiter.cleanup();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Database
initDB();

// ============= MIDDLEWARE =============

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply rate limiting to all API routes
app.use('/api/auth', authRateLimiter.middleware());
app.use('/api', apiRateLimiter.middleware());

// Stripe Webhook — MUST be before express.json() because it needs raw body
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { eventId, userId } = session.metadata;
    const qrCodeData = `CITYEVENT-${uuidv4()}`;
    const id = uuidv4();

    try {
      await db.query(
        'INSERT INTO registrations (id, event_id, user_id, qr_code_data, amount_paid, payment_intent_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, eventId, userId, qrCodeData, (session.amount_total / 100).toFixed(2), session.payment_intent]
      );
      
      // Fire ticket email asynchronously — don't block the webhook response
      processTicket({
        db,
        registrationId: id,
        eventId,
        userId,
        qrCodeData,
        amountPaid: (session.amount_total / 100),
      }).catch(err => console.error('Ticket processing error:', err.message));
      
    } catch (err) {
      console.error('Webhook DB error:', err);
    }
  }

  res.json({ received: true });
});

app.use(compression());
app.use(httpLogger);
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://*.firebaseio.com", "https://*.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.googleapis.com", "https://*.unsplash.com"],
      connectSrc: ["'self'", "https://*.firebaseio.com", "https://identitytoolkit.googleapis.com", "https://api.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://*.stripe.com"],
    }
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// CSRF Protection
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'city-event-csrf-secret-change-in-production',
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: NODE_ENV === 'production',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Cookie parser for CSRF
app.use(cookieParser());

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

// Apply CSRF protection to all non-GET API routes (except webhooks)
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || req.path === '/webhooks/stripe') {
    return next();
  }
  doubleCsrfProtection(req, res, next);
});

// Firebase App Check verification middleware
const verifyAppCheck = async (req, res, next) => {
  if (NODE_ENV === 'development' || !process.env.FIREBASE_APP_CHECK_SECRET) {
    return next();
  }
  try {
    const appCheckToken = req.headers['x-firebase-appcheck'];
    if (!appCheckToken) {
      return res.status(401).json({ error: 'App Check token required' });
    }
    await admin.appCheck().verifyToken(appCheckToken);
    next();
  } catch (err) {
    logger.error({ err }, 'App Check verification failed');
    return res.status(401).json({ error: 'App Check verification failed' });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Async Error Wrapper
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============= AUTH MIDDLEWARE =============

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      role: 'student' // Default, will be overridden from DB
    };

    // Ensure user profile exists in Postgres and get role
    const userRes = await db.query('SELECT role, full_name FROM profiles WHERE id = $1', [decodedToken.uid]);

    if (userRes.rows.length === 0) {
      // Auto-create profile for new Firebase users
      const fullName = decodedToken.name || decodedToken.email.split('@')[0];
      await db.query(
        'INSERT INTO profiles (id, email, full_name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [decodedToken.uid, decodedToken.email, fullName, 'student']
      );
      req.user.fullName = fullName;
    } else {
      req.user.role = userRes.rows[0].role;
      req.user.fullName = userRes.rows[0].full_name;
    }

    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional auth - sets user if token present, but doesn't require it
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { id: decodedToken.uid, email: decodedToken.email, role: 'student' };

    const userRes = await db.query('SELECT role, full_name FROM profiles WHERE id = $1', [decodedToken.uid]);
    if (userRes.rows.length > 0) {
      req.user.role = userRes.rows[0].role;
      req.user.fullName = userRes.rows[0].full_name;
    }
  } catch {
    req.user = null;
  }

  next();
};

// Role-based access control
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ============= AUTH ROUTES =============

// Get current user
app.get('/api/auth/me', authenticateToken, catchAsync(async (req, res) => {
  const result = await db.query('SELECT id, email, full_name, role, created_at FROM profiles WHERE id = $1', [req.user.id]);
  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    createdAt: user.created_at
  });
}));

// Update current user profile
app.put('/api/auth/me', authenticateToken, catchAsync(async (req, res) => {
  const { fullName, role } = req.body;

  if (fullName && fullName.trim().length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters' });
  }

  // Only allow role setting on initial profile creation (organizer signup)
  // Don't allow role escalation after the fact
  if (role && ['student', 'organizer'].includes(role)) {
    const currentProfile = await db.query('SELECT role FROM profiles WHERE id = $1', [req.user.id]);
    // Only allow role change if current role is 'student' (first-time setup)
    if (currentProfile.rows.length > 0 && currentProfile.rows[0].role === 'student') {
      await db.query(
        'UPDATE profiles SET full_name = COALESCE($1, full_name), role = $2 WHERE id = $3',
        [fullName || null, role, req.user.id]
      );
    } else {
      await db.query(
        'UPDATE profiles SET full_name = COALESCE($1, full_name) WHERE id = $2',
        [fullName || null, req.user.id]
      );
    }
  } else {
    await db.query(
      'UPDATE profiles SET full_name = COALESCE($1, full_name) WHERE id = $2',
      [fullName || null, req.user.id]
    );
  }

  res.json({ message: 'Profile updated successfully' });
}));

// ============= EVENTS ROUTES =============

// Get all events (PUBLIC - no auth required)
app.get('/api/events', optionalAuth, cacheMiddleware(60), catchAsync(async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT e.*, COALESCE(CAST(COUNT(r.id) AS INTEGER), 0) AS registration_count
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE 1=1
  `;

  const params = [];

  // Filter by status: show approved + user's own pending events
  if (!(req.user && req.user.role === 'admin')) {
    if (req.user) {
      params.push(req.user.id);
      query += ` AND (e.status = 'approved' OR e.organizer_id = $${params.length})`;
    } else {
      query += ` AND e.status = 'approved'`;
    }
  }

  if (category && category !== 'all') {
    params.push(category);
    query += ` AND e.category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`;
  }

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query.replace('e.*, COALESCE(CAST(COUNT(r.id) AS INTEGER), 0) AS registration_count', 'e.id')}) AS subquery`;
  const countRes = await db.query(countQuery, params);
  const totalCount = parseInt(countRes.rows[0].count);

  // Add grouping, sorting, and pagination
  query += ' GROUP BY e.id ORDER BY e.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limitNum, offset);

  const eventsRes = await db.query(query, params);

  const events = eventsRes.rows.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    dateTime: e.date_time,
    capacity: e.capacity,
    organizerId: e.organizer_id,
    imageUrl: e.image_url,
    category: e.category,
    price: parseFloat(e.price || 0),
    currency: e.currency || 'usd',
    createdAt: e.created_at,
    registrationCount: e.registration_count,
    isFull: e.registration_count >= e.capacity
  }));

  res.json({
    data: events,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
}));

// Get single event (PUBLIC)
app.get('/api/events/:id', optionalAuth, catchAsync(async (req, res) => {
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  const e = eventRes.rows[0];

  if (!e) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const countRes = await db.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1', [e.id]);
  const checkedInRes = await db.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND checked_in = true', [e.id]);

  const registrationCount = parseInt(countRes.rows[0].count, 10);
  const checkedInCount = parseInt(checkedInRes.rows[0].count, 10);

  res.json({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    dateTime: e.date_time,
    capacity: e.capacity,
    organizerId: e.organizer_id,
    imageUrl: e.image_url,
    category: e.category,
    price: parseFloat(e.price || 0),
    currency: e.currency || 'usd',
    createdAt: e.created_at,
    registrationCount,
    checkedInCount,
    isFull: registrationCount >= e.capacity,
    seriesId: e.series_id || null,
    recurrenceRule: e.recurrence_rule || null
  });
}));

// Create event (organizers/admin only)
app.post('/api/events', authenticateToken, requireRole('organizer', 'admin'), validateEventCreation, catchAsync(async (req, res) => {
  const { title, description, location, dateTime, capacity, imageUrl, category, price, currency, recurrenceRule } = req.body;

  const id = uuidv4();
  const seriesId = recurrenceRule ? uuidv4() : null;

  await db.query(
    `INSERT INTO events (id, title, description, location, date_time, capacity, organizer_id, image_url, category, price, currency, recurrence_rule, series_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [id, title, description || '', location, dateTime, parseInt(capacity), req.user.id, imageUrl || '', category || 'Other', price ? parseFloat(price) : 0.00, currency || 'usd', recurrenceRule || null, seriesId, 'pending']
  );

  // If recurring, create instances for the next 12 months
  if (recurrenceRule) {
    const startDate = new Date(dateTime);
    const instances = [];
    const maxInstances = 12;
    for (let i = 1; i <= maxInstances; i++) {
      const nextDate = new Date(startDate);
      if (recurrenceRule === 'weekly') nextDate.setDate(nextDate.getDate() + i * 7);
      else if (recurrenceRule === 'biweekly') nextDate.setDate(nextDate.getDate() + i * 14);
      else if (recurrenceRule === 'monthly') nextDate.setMonth(nextDate.getMonth() + i);
      else break;

      const instanceId = uuidv4();
      await db.query(
        `INSERT INTO events (id, title, description, location, date_time, capacity, organizer_id, image_url, category, price, currency, series_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [instanceId, title, description || '', location, nextDate.toISOString(), parseInt(capacity), req.user.id, imageUrl || '', category || 'Other', price ? parseFloat(price) : 0.00, currency || 'usd', seriesId]
      );
      instances.push(instanceId);
    }
  }

  res.status(201).json({
    id,
    title,
    description: description || '',
    location,
    dateTime,
    capacity: parseInt(capacity),
    organizerId: req.user.id,
    imageUrl: imageUrl || '',
    category: category || 'Other',
    price: price ? parseFloat(price) : 0.00,
    currency: currency || 'usd',
    seriesId,
    recurrenceRule: recurrenceRule || null
  });
}));

// Update event
app.put('/api/events/:id', authenticateToken, catchAsync(async (req, res) => {
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  const event = eventRes.rows[0];

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this event' });
  }

  const { title, description, location, dateTime, capacity, imageUrl, category, price, currency } = req.body;

  await db.query(
    `UPDATE events SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      location = COALESCE($3, location),
      date_time = COALESCE($4, date_time),
      capacity = COALESCE($5, capacity),
      image_url = COALESCE($6, image_url),
      category = COALESCE($7, category),
      price = COALESCE($8, price),
      currency = COALESCE($9, currency)
     WHERE id = $10`,
    [title || null, description || null, location || null, dateTime || null, capacity ? parseInt(capacity) : null, imageUrl || null, category || null, price !== undefined ? parseFloat(price) : null, currency || null, req.params.id]
  );

  res.json({ message: 'Event updated successfully' });
}));

// Delete event
app.delete('/api/events/:id', authenticateToken, catchAsync(async (req, res) => {
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  const event = eventRes.rows[0];

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to delete this event' });
  }

  await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.json({ message: 'Event deleted successfully' });
}));

// Get organizer's events (authenticated)
app.get('/api/events/my-events', authenticateToken, catchAsync(async (req, res) => {
  const result = await db.query(`
    SELECT e.*,
      COALESCE(CAST(COUNT(r.id) AS INTEGER), 0) AS registration_count,
      COALESCE(CAST(COUNT(r.id) FILTER (WHERE r.checked_in = true) AS INTEGER), 0) AS checked_in_count,
      COALESCE(SUM(r.amount_paid), 0) AS total_revenue
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE e.organizer_id = $1
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `, [req.user.id]);

  res.json(result.rows.map(e => ({
    id: e.id, title: e.title, description: e.description,
    location: e.location, dateTime: e.date_time,
    capacity: e.capacity, price: parseFloat(e.price || 0),
    currency: e.currency || 'usd', status: e.status,
    imageUrl: e.image_url, category: e.category,
    registrationCount: e.registration_count,
    checkedInCount: e.checked_in_count,
    totalRevenue: parseFloat(e.total_revenue || 0),
    createdAt: e.created_at
  })));
}));

// Get attendees for an event (organizer/admin only)
app.get('/api/events/:id/attendees', authenticateToken, catchAsync(async (req, res) => {
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  const event = eventRes.rows[0];
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const result = await db.query(`
    SELECT r.id, r.qr_code_data, r.checked_in, r.checked_in_at, r.amount_paid, r.registered_at,
      p.full_name, p.email
    FROM registrations r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.event_id = $1
    ORDER BY r.registered_at DESC
  `, [req.params.id]);

  res.json({
    event: { id: event.id, title: event.title, capacity: event.capacity },
    attendees: result.rows.map(a => ({
      id: a.id, fullName: a.full_name, email: a.email,
      qrCodeData: a.qr_code_data, checkedIn: a.checked_in,
      checkedInAt: a.checked_in_at,
      amountPaid: parseFloat(a.amount_paid || 0),
      registeredAt: a.registered_at
    })),
    totalAttendees: result.rows.length,
    checkedInCount: result.rows.filter(a => a.checked_in).length
  });
}));

// Get per-event analytics (organizer/admin only)
app.get('/api/events/:id/analytics', authenticateToken, catchAsync(async (req, res) => {
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  const event = eventRes.rows[0];
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const regRes = await db.query(
    'SELECT DATE(registered_at) as date, COUNT(*) as count FROM registrations WHERE event_id = $1 GROUP BY DATE(registered_at) ORDER BY date',
    [req.params.id]
  );

  const regCount = await db.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1', [req.params.id]);
  const checkedCount = await db.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND checked_in = true', [req.params.id]);
  const revenueRes = await db.query('SELECT COALESCE(SUM(amount_paid), 0) as total FROM registrations WHERE event_id = $1', [req.params.id]);

  res.json({
    totalRegistrations: parseInt(regCount.rows[0].count),
    checkedInCount: parseInt(checkedCount.rows[0].count),
    totalRevenue: parseFloat(revenueRes.rows[0].total),
    registrationTrend: regRes.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
    capacity: event.capacity,
    fillRate: event.capacity > 0 ? Math.round((parseInt(regCount.rows[0].count) / event.capacity) * 100) : 0
  });
}));

// Upload event image (authenticated)
app.post('/api/upload', authenticateToken, upload.single('image'), catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
}));

// Download calendar .ics for event (PUBLIC)
app.get('/api/events/:id/ics', optionalAuth, catchAsync(async (req, res) => {
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  const e = eventRes.rows[0];
  if (!e) return res.status(404).json({ error: 'Event not found' });

  const calendar = ical({ name: 'City Event', timezone: 'UTC' });
  calendar.createEvent({
    start: new Date(e.date_time),
    end: new Date(new Date(e.date_time).getTime() + 2 * 60 * 60 * 1000),
    summary: e.title,
    description: e.description?.substring(0, 200) || '',
    location: e.location,
    url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${e.id}`,
    organizer: { name: 'City Event' }
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${e.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`);
  res.send(calendar.toString());
}));

// Event Series — get recurring instances
app.get('/api/series/:seriesId', catchAsync(async (req, res) => {
  const result = await db.query(
    'SELECT * FROM events WHERE series_id = $1 ORDER BY date_time ASC',
    [req.params.seriesId]
  );
  res.json({ seriesId: req.params.seriesId, events: result.rows.map(e => ({
    id: e.id, title: e.title, dateTime: e.date_time, location: e.location,
    capacity: e.capacity, imageUrl: e.image_url, price: parseFloat(e.price || 0)
  })) });
}));

// ============= TICKET TIERS ROUTES =============

// Get ticket tiers for an event (PUBLIC)
app.get('/api/events/:eventId/ticket-tiers', catchAsync(async (req, res) => {
  const tiersRes = await db.query('SELECT * FROM ticket_tiers WHERE event_id = $1 ORDER BY price ASC', [req.params.eventId]);
  res.json(tiersRes.rows);
}));

// Create a ticket tier (organizer/admin only)
app.post('/api/events/:eventId/ticket-tiers', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { name, description, price, capacity, availableFrom, availableTo } = req.body;

  const eventRes = await db.query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
  if (eventRes.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  if (eventRes.rows[0].organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const id = uuidv4();
  await db.query(
    `INSERT INTO ticket_tiers (id, event_id, name, description, price, capacity, available_from, available_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, eventId, name, description || '', parseFloat(price), parseInt(capacity), availableFrom || null, availableTo || null]
  );

  res.status(201).json({ id, eventId, name, description, price, capacity, availableFrom, availableTo });
}));

// ============= PROMO CODES ROUTES =============

// Create a promo code (organizer/admin only)
app.post('/api/events/:eventId/promo-codes', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { code, discountType, discountValue, maxUses, validFrom, validTo } = req.body;

  const eventRes = await db.query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
  if (eventRes.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  if (eventRes.rows[0].organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const id = uuidv4();
  await db.query(
    `INSERT INTO promo_codes (id, event_id, code, discount_type, discount_value, max_uses, valid_from, valid_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, eventId, code.toUpperCase(), discountType, parseFloat(discountValue), maxUses ? parseInt(maxUses) : null, validFrom || null, validTo || null]
  );

  res.status(201).json({ message: 'Promo code created successfully' });
}));

// Validate a promo code
app.post('/api/events/:eventId/validate-promo', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { code } = req.body;

  const promoRes = await db.query(
    'SELECT * FROM promo_codes WHERE event_id = $1 AND code = $2',
    [eventId, code.toUpperCase()]
  );

  if (promoRes.rows.length === 0) return res.status(404).json({ error: 'Invalid promo code' });
  const promo = promoRes.rows[0];

  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
    return res.status(400).json({ error: 'Promo code limit reached' });
  }

  const now = new Date();
  if (promo.valid_from && new Date(promo.valid_from) > now) return res.status(400).json({ error: 'Promo code not yet active' });
  if (promo.valid_to && new Date(promo.valid_to) < now) return res.status(400).json({ error: 'Promo code expired' });

  res.json({
    id: promo.id,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: parseFloat(promo.discount_value)
  });
}));

// ============= REGISTRATIONS ROUTES =============

// Register for a FREE event
app.post('/api/registrations', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID required' });
  }

  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventRes.rows[0];
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const existing = await db.query('SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2', [eventId, req.user.id]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Already registered for this event' });
  }

  // Block free registration for paid events
  if (event.price && parseFloat(event.price) > 0) {
    return res.status(400).json({ error: 'This is a paid event. Please proceed to checkout to purchase a ticket.' });
  }

  const countRes = await db.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1', [eventId]);
  if (parseInt(countRes.rows[0].count, 10) >= event.capacity) {
    return res.status(400).json({ error: 'Event is full' });
  }

  const qrCodeData = `CITYEVENT-${uuidv4()}`;
  const id = uuidv4();

  await db.query(
    'INSERT INTO registrations (id, event_id, user_id, qr_code_data) VALUES ($1, $2, $3, $4)',
    [id, eventId, req.user.id, qrCodeData]
  );

  // Fire ticket email asynchronously — don't block the response
  processTicket({
    db,
    registrationId: id,
    eventId,
    userId: req.user.id,
    qrCodeData,
    amountPaid: 0,
  }).catch(err => console.error('Ticket processing error:', err.message));

  res.status(201).json({
    id,
    eventId,
    userId: req.user.id,
    qrCodeData,
    checkedIn: false,
    event: { title: event.title, dateTime: event.date_time, location: event.location }
  });
}));
// Checkout for PAID event (Stripe)
app.post('/api/registrations/checkout', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'Event ID required' });

  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventRes.rows[0];
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const countRes = await db.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1', [eventId]);
  if (parseInt(countRes.rows[0].count, 10) >= event.capacity) return res.status(400).json({ error: 'Event is full' });

  const existing = await db.query('SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2', [eventId, req.user.id]);
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Already registered for this event' });

  if (!event.price || parseFloat(event.price) <= 0) {
    return res.status(400).json({ error: 'Use standard registration for free events' });
  }

  const ticketPrice = parseFloat(event.price);
  const platformFee = ticketPrice * 0.05; // 5% platform fee

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: event.title, description: `Ticket for ${event.title} at ${event.location}` },
          unit_amount: Math.round(ticketPrice * 100),
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Platform Fee (5%)', description: 'Platform processing fee' },
          unit_amount: Math.round(platformFee * 100),
        },
        quantity: 1,
      }
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets?success=true`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${eventId}?canceled=true`,
    metadata: { eventId, userId: req.user.id }
  });

  res.json({ url: session.url });
}));

// Get user's tickets
app.get('/api/registrations/my-tickets', authenticateToken, catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const countRes = await db.query('SELECT COUNT(*) FROM registrations WHERE user_id = $1', [req.user.id]);
  const totalCount = parseInt(countRes.rows[0].count);

  const result = await db.query(`
    SELECT r.*, e.title, e.date_time, e.location, e.image_url
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = $1
    ORDER BY r.registered_at DESC
    LIMIT $2 OFFSET $3
  `, [req.user.id, limitNum, offset]);

  const tickets = result.rows.map(r => ({
    id: r.id,
    eventId: r.event_id,
    userId: r.user_id,
    qrCodeData: r.qr_code_data,
    checkedIn: r.checked_in,
    checkedInAt: r.checked_in_at,
    amountPaid: parseFloat(r.amount_paid || 0),
    registeredAt: r.registered_at,
    event: {
      id: r.event_id,
      title: r.title,
      dateTime: r.date_time,
      location: r.location,
      imageUrl: r.image_url
    }
  }));

  res.json({
    data: tickets,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
}));

// Get single registration
app.get('/api/registrations/:id', authenticateToken, catchAsync(async (req, res) => {
  const result = await db.query(`
    SELECT r.*, e.title, e.date_time, e.location, e.image_url
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.id = $1
  `, [req.params.id]);

  const r = result.rows[0];
  if (!r) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  if (r.user_id !== req.user.id && req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  res.json({
    id: r.id,
    eventId: r.event_id,
    userId: r.user_id,
    qrCodeData: r.qr_code_data,
    checkedIn: r.checked_in,
    checkedInAt: r.checked_in_at,
    event: {
      title: r.title,
      dateTime: r.date_time,
      location: r.location,
      imageUrl: r.image_url
    }
  });
}));

// Cancel registration / request refund
app.post('/api/registrations/:id/cancel', authenticateToken, catchAsync(async (req, res) => {
  const regRes = await db.query(`
    SELECT r.*, e.title, e.price, e.organizer_id, r.payment_intent_id
    FROM registrations r JOIN events e ON r.event_id = e.id
    WHERE r.id = $1
  `, [req.params.id]);
  const reg = regRes.rows[0];
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  if (reg.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

  // Issue full refund via Stripe
  let refunded = false;
  if (reg.payment_intent_id && parseFloat(reg.amount_paid || 0) > 0) {
    try {
      await stripe.refunds.create({
        payment_intent: reg.payment_intent_id,
        reason: 'requested_by_customer'
      });
      refunded = true;
    } catch (err) {
      console.error('Refund error:', err.message);
    }
  }

  await db.query('DELETE FROM registrations WHERE id = $1', [req.params.id]);

  // Notify waitlisted users
  const waitlistRes = await db.query(
    'SELECT w.*, p.email, p.full_name FROM waitlist w JOIN profiles p ON w.user_id = p.id WHERE w.event_id = $1 ORDER BY w.joined_at ASC LIMIT 1',
    [reg.event_id]
  );
  if (waitlistRes.rows.length > 0) {
    const next = waitlistRes.rows[0];
    await db.query('DELETE FROM waitlist WHERE id = $1', [next.id]);
    // Trigger email notification (async)
    import('./services/emailService.js').then(({ sendWaitlistNotification }) => {
      sendWaitlistNotification(next.email, next.full_name, reg.title);
    }).catch(err => console.error('Waitlist email error:', err.message));
  }

  res.json({ message: 'Registration cancelled', refunded });
}));

// ============= WAITLIST ROUTES =============

// Join waitlist for a full event
app.post('/api/waitlist', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'Event ID required' });

  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventRes.rows[0];
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const existing = await db.query(
    'SELECT * FROM waitlist WHERE event_id = $1 AND user_id = $2',
    [eventId, req.user.id]
  );
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Already on waitlist' });

  const alreadyReg = await db.query(
    'SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2',
    [eventId, req.user.id]
  );
  if (alreadyReg.rows.length > 0) return res.status(400).json({ error: 'Already registered' });

  const id = uuidv4();
  await db.query(
    'INSERT INTO waitlist (id, event_id, user_id) VALUES ($1, $2, $3)',
    [id, eventId, req.user.id]
  );

  res.status(201).json({ id, eventId, userId: req.user.id });
}));

// Leave waitlist
app.delete('/api/waitlist/:eventId', authenticateToken, catchAsync(async (req, res) => {
  await db.query(
    'DELETE FROM waitlist WHERE event_id = $1 AND user_id = $2',
    [req.params.eventId, req.user.id]
  );
  res.json({ message: 'Removed from waitlist' });
}));

// Check waitlist status for an event
app.get('/api/waitlist/:eventId/status', authenticateToken, catchAsync(async (req, res) => {
  const result = await db.query(
    'SELECT id, joined_at FROM waitlist WHERE event_id = $1 AND user_id = $2',
    [req.params.eventId, req.user.id]
  );
  res.json({ onWaitlist: result.rows.length > 0, joinedAt: result.rows[0]?.joined_at || null });
}));

// Get user's waitlist entries
app.get('/api/waitlist/my-list', authenticateToken, catchAsync(async (req, res) => {
  const result = await db.query(`
    SELECT w.*, e.title, e.date_time, e.location, e.image_url
    FROM waitlist w
    JOIN events e ON w.event_id = e.id
    WHERE w.user_id = $1
    ORDER BY w.joined_at DESC
  `, [req.user.id]);

  res.json(result.rows.map(w => ({
    id: w.id, eventId: w.event_id, joinedAt: w.joined_at,
    event: { title: w.title, dateTime: w.date_time, location: w.location, imageUrl: w.image_url }
  })));
}));

// Stripe Customer Portal (saved payment methods)
app.post('/api/billing/portal', authenticateToken, catchAsync(async (req, res) => {
  // Find or create Stripe customer
  let customerId;
  const profileRes = await db.query('SELECT stripe_customer_id FROM profiles WHERE id = $1', [req.user.id]);
  if (profileRes.rows.length > 0 && profileRes.rows[0].stripe_customer_id) {
    customerId = profileRes.rows[0].stripe_customer_id;
  } else {
    const userRes = await db.query('SELECT email, full_name FROM profiles WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { userId: req.user.id }
    });
    customerId = customer.id;
    await db.query('UPDATE profiles SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.user.id]);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets`
  });

  res.json({ url: session.url });
}));

// ============= CHECK-IN ROUTES =============

// Scan QR code and check-in
app.post('/api/checkin/scan', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
  const { qrCodeData, eventId } = req.body;

  if (!qrCodeData) {
    return res.status(400).json({ error: 'QR code data required' });
  }

  const result = await db.query(`
    SELECT r.*, p.full_name, p.email, e.title, e.location
    FROM registrations r
    JOIN profiles p ON r.user_id = p.id
    JOIN events e ON r.event_id = e.id
    WHERE r.qr_code_data = $1
  `, [qrCodeData]);

  const reg = result.rows[0];

  if (!reg) {
    return res.status(404).json({
      success: false, error: 'Invalid ticket', message: 'This QR code is not valid'
    });
  }

  if (eventId && reg.event_id !== eventId) {
    return res.status(400).json({
      success: false, error: 'Wrong event', message: 'This ticket is for a different event'
    });
  }

  if (reg.checked_in) {
    return res.status(400).json({
      success: false, error: 'Already checked in',
      message: `${reg.full_name || 'This attendee'} already checked in at ${new Date(reg.checked_in_at).toLocaleTimeString()}`
    });
  }

  await db.query('UPDATE registrations SET checked_in = true, checked_in_at = NOW() WHERE id = $1', [reg.id]);

  res.json({
    success: true,
    message: 'Check-in successful!',
    registration: {
      id: reg.id,
      user: { id: reg.user_id, fullName: reg.full_name, email: reg.email },
      event: { id: reg.event_id, title: reg.title, location: reg.location }
    }
  });
}));

// Get check-in stats for an event
app.get('/api/checkin/event/:eventId', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.eventId]);
  const event = eventRes.rows[0];

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const regRes = await db.query(`
    SELECT r.*, p.full_name, p.email
    FROM registrations r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.event_id = $1
  `, [req.params.eventId]);

  const registrations = regRes.rows;
  const checkedIn = registrations.filter(r => r.checked_in);

  const attendees = registrations.map(reg => ({
    id: reg.id,
    userName: reg.full_name || 'Unknown',
    userEmail: reg.email || '',
    checkedIn: reg.checked_in,
    checkedInAt: reg.checked_in_at,
    registeredAt: reg.registered_at
  }));

  res.json({
    event: {
      id: event.id,
      title: event.title,
      capacity: event.capacity
    },
    totalRegistrations: registrations.length,
    checkedInCount: checkedIn.length,
    capacity: event.capacity,
    attendees
  });
}));

// ============= ADMIN ROUTES =============

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const result = await db.query('SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC');
  res.json(result.rows.map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    createdAt: u.created_at
  })));
}));

// Update user role
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'organizer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  await db.query('UPDATE profiles SET role = $1 WHERE id = $2', [role, req.params.id]);
  res.json({ message: 'Role updated successfully' });
}));

// Get pending events (admin moderation)
app.get('/api/admin/events/pending', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const result = await db.query(
    'SELECT e.*, p.full_name as organizer_name FROM events e JOIN profiles p ON e.organizer_id = p.id WHERE e.status = $1 ORDER BY e.created_at ASC',
    ['pending']
  );
  res.json(result.rows.map(e => ({
    id: e.id, title: e.title, description: e.description, location: e.location,
    dateTime: e.date_time, capacity: e.capacity, organizerId: e.organizer_id,
    organizerName: e.organizer_name, imageUrl: e.image_url, category: e.category,
    price: parseFloat(e.price || 0), status: e.status, createdAt: e.created_at
  })));
}));

// Approve or reject event
app.put('/api/admin/events/:id/status', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }
  await db.query('UPDATE events SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ message: `Event ${status} successfully` });
}));

// Get platform analytics
app.get('/api/admin/analytics', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const usersRes = await db.query('SELECT COUNT(*) FROM profiles');
  const eventsRes = await db.query('SELECT COUNT(*) FROM events');
  const registrationsRes = await db.query('SELECT COUNT(*) FROM registrations');

  const revenueRes = await db.query(`
    SELECT COALESCE(SUM(r.amount_paid), 0) as total_revenue
    FROM registrations r
    WHERE r.amount_paid > 0
  `);

  res.json({
    totalUsers: parseInt(usersRes.rows[0].count),
    totalEvents: parseInt(eventsRes.rows[0].count),
    totalRegistrations: parseInt(registrationsRes.rows[0].count),
    totalRevenue: parseFloat(revenueRes.rows[0].total_revenue)
  });
}));

// ============= REVIEWS ROUTES =============

// Get reviews for an event (PUBLIC)
app.get('/api/events/:eventId/reviews', catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const countRes = await db.query('SELECT COUNT(*) FROM reviews WHERE event_id = $1', [eventId]);
  const totalCount = parseInt(countRes.rows[0].count);

  const result = await db.query(`
    SELECT r.*, p.full_name as user_name
    FROM reviews r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.event_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `, [eventId, limitNum, offset]);

  const reviews = result.rows.map(r => ({
    id: r.id,
    eventId: r.event_id,
    userId: r.user_id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));

  res.json({
    data: reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
}));

// Get review statistics for an event (PUBLIC)
app.get('/api/events/:eventId/reviews/stats', catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const statsRes = await db.query(`
    SELECT 
      COUNT(*) as total_reviews,
      COALESCE(AVG(rating), 0) as average_rating,
      COUNT(*) FILTER (WHERE rating = 5) as five_star,
      COUNT(*) FILTER (WHERE rating = 4) as four_star,
      COUNT(*) FILTER (WHERE rating = 3) as three_star,
      COUNT(*) FILTER (WHERE rating = 2) as two_star,
      COUNT(*) FILTER (WHERE rating = 1) as one_star
    FROM reviews WHERE event_id = $1
  `, [eventId]);

  const stats = statsRes.rows[0];
  res.json({
    totalReviews: parseInt(stats.total_reviews),
    averageRating: parseFloat(stats.average_rating),
    distribution: {
      5: parseInt(stats.five_star),
      4: parseInt(stats.four_star),
      3: parseInt(stats.three_star),
      2: parseInt(stats.two_star),
      1: parseInt(stats.one_star),
    }
  });
}));

// Submit a review for an event (authenticated)
app.post('/api/events/:eventId/reviews', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (!comment || comment.trim().length < 2) {
    return res.status(400).json({ error: 'Comment must be at least 2 characters' });
  }

  // Check if event exists
  const eventRes = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
  if (eventRes.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Check if user already reviewed this event
  const existingRes = await db.query(
    'SELECT id FROM reviews WHERE event_id = $1 AND user_id = $2',
    [eventId, req.user.id]
  );
  if (existingRes.rows.length > 0) {
    return res.status(400).json({ error: 'You have already reviewed this event' });
  }

  const id = uuidv4();
  await db.query(
    'INSERT INTO reviews (id, event_id, user_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
    [id, eventId, req.user.id, rating, comment.trim()]
  );

  res.status(201).json({ id, eventId, rating, comment, userId: req.user.id });
}));

// Delete own review
app.delete('/api/events/:eventId/reviews/:reviewId', authenticateToken, catchAsync(async (req, res) => {
  const { eventId, reviewId } = req.params;

  const reviewRes = await db.query('SELECT * FROM reviews WHERE id = $1 AND event_id = $2', [reviewId, eventId]);
  const review = reviewRes.rows[0];

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  if (review.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
  res.json({ message: 'Review deleted successfully' });
}));

// ============= GDPR ROUTES =============

// Export all user data (GDPR Article 20)
app.get('/api/gdpr/export', authenticateToken, catchAsync(async (req, res) => {
  const profileRes = await db.query('SELECT * FROM profiles WHERE id = $1', [req.user.id]);
  const registrationsRes = await db.query(`
    SELECT r.*, e.title, e.date_time, e.location FROM registrations r
    JOIN events e ON r.event_id = e.id WHERE r.user_id = $1
  `, [req.user.id]);
  const reviewsRes = await db.query('SELECT * FROM reviews WHERE user_id = $1', [req.user.id]);
  const waitlistRes = await db.query(`
    SELECT w.*, e.title FROM waitlist w
    JOIN events e ON w.event_id = e.id WHERE w.user_id = $1
  `, [req.user.id]);

  res.json({
    exportedAt: new Date().toISOString(),
    profile: profileRes.rows[0] || null,
    registrations: registrationsRes.rows,
    reviews: reviewsRes.rows,
    waitlist: waitlistRes.rows,
  });
}));

// Delete user account and all data (GDPR Article 17 - Right to erasure)
app.delete('/api/gdpr/delete-account', authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Delete all user data
  await db.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM waitlist WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM registrations WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM events WHERE organizer_id = $1', [userId]);
  await db.query('DELETE FROM profiles WHERE id = $1', [userId]);

  // Delete Firebase auth user
  try {
    await admin.auth().deleteUser(userId);
  } catch (err) {
    logger.warn({ err }, 'Firebase user deletion (may already be deleted)');
  }

  res.json({ message: 'Account and all associated data permanently deleted' });
}));

// ============= TICKET PDF DOWNLOAD =============

// Download ticket as PDF
app.get('/api/tickets/:id/pdf', authenticateToken, catchAsync(async (req, res) => {
  const result = await db.query(`
    SELECT r.*, e.title, e.date_time, e.location, p.full_name, p.email
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN profiles p ON r.user_id = p.id
    WHERE r.id = $1
  `, [req.params.id]);

  const ticket = result.rows[0];
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { generateTicketPdf } = await import('./services/pdfService.js');
  const pdfBuffer = await generateTicketPdf({
    attendeeName: ticket.full_name,
    eventTitle: ticket.title,
    eventDate: new Date(ticket.date_time).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }),
    eventLocation: ticket.location,
    qrCodeDataUrl: null,
    ticketId: ticket.id,
    amountPaid: parseFloat(ticket.amount_paid || 0),
  });

  if (!pdfBuffer) {
    return res.status(503).json({ error: 'PDF generation unavailable. Please view your ticket on the My Tickets page.' });
  }

  const fileName = `${ticket.title.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(pdfBuffer);
}));

// ============= HEALTH CHECK =============

app.get('/api/health', catchAsync(async (req, res) => {
  const users = await db.query('SELECT COUNT(*) FROM profiles');
  const events = await db.query('SELECT COUNT(*) FROM events');
  const registrations = await db.query('SELECT COUNT(*) FROM registrations');

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
    stats: {
      users: parseInt(users.rows[0].count),
      events: parseInt(events.rows[0].count),
      registrations: parseInt(registrations.rows[0].count)
    }
  });
}));

// Root route
app.get('/', (req, res) => {
  res.send('🌆 City Event Backend API is running!');
});

// ============= ERROR HANDLING =============

// Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// Global error handler
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  const status = err.status || 500;
  const message = NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(status).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 City Event Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
});
