import express from 'express';
import cors from 'cors';
import compression from 'compression';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ical from 'ical-generator';
import * as Sentry from '@sentry/node';
import { validateEventCreation, validateEventUpdate } from './validators.js';
import validateEnvironment from './validateEnv.js';
import rateLimit from 'express-rate-limit';
import { db as fsdb, initDB } from './db.js';
import { processTicket, incrementPromoUsage } from './services/ticketService.js';
import { logger, httpLogger } from './logger.js';
import { cacheMiddleware } from './cache.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { onRequest } from 'firebase-functions/v2/https';

// Validate environment configuration before starting
validateEnvironment();

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Initialize rate limiters
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too Many Requests', message: 'Too many auth attempts. Try again in 15 minutes.' }
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' }
});

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

try { await initDB(); } catch (e) { logger.error({ err: e }, 'Firestore init failed'); }

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

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Stripe webhook secret not configured on server' });
  }
  try {
    stripeEvent = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { eventId, userId } = session.metadata;
    const qrCodeData = `CITYEVENT-${uuidv4()}`;
    const id = uuidv4();
    const amountPaid = (session.amount_total / 100).toFixed(2);

    try {
      await fsdb.runTransaction(async (transaction) => {
        const eventRef = fsdb.collection('events').doc(eventId);
        const eventSnap = await transaction.get(eventRef);
        if (!eventSnap.exists) {
          logger.warn({ eventId }, 'Webhook: event not found');
          return;
        }
        const currentCount = eventSnap.data().registration_count || 0;
        if (currentCount >= eventSnap.data().capacity) {
          logger.warn({ eventId }, 'Webhook: event full, issuing refund');
          await stripe.refunds.create({ payment_intent: session.payment_intent, reason: 'duplicate' });
          return;
        }
        const regRef = fsdb.collection('registrations').doc(id);
        transaction.set(regRef, {
          id, event_id: eventId, user_id: userId, qr_code_data: qrCodeData,
          checked_in: false, checked_in_at: null, amount_paid: amountPaid,
          payment_intent_id: session.payment_intent, registered_at: new Date().toISOString()
        });
        transaction.update(eventRef, { registration_count: admin.firestore.FieldValue.increment(1) });
      });

      processTicket({ fsdb, registrationId: id, eventId, userId, qrCodeData, amountPaid: parseFloat(amountPaid) })
        .catch(err => logger.error({ err, registrationId: id }, 'Ticket processing error'));
    } catch (err) {
      logger.error({ err }, 'Webhook DB error');
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
if (!process.env.CSRF_SECRET && NODE_ENV === 'production') {
  throw new Error('CSRF_SECRET environment variable is required in production');
}
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || (NODE_ENV === 'development' ? 'dev-csrf-secret' : (() => { throw new Error('CSRF_SECRET not configured'); })()),
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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
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
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { id: decodedToken.uid, email: decodedToken.email, role: 'student' };

      const profile = await fsdb.getDoc('profiles', decodedToken.uid);
      if (profile) {
        req.user.role = profile.role || 'student';
        req.user.fullName = profile.full_name;
      } else {
        const fullName = decodedToken.name || decodedToken.email.split('@')[0];
        await fsdb.setDoc('profiles', decodedToken.uid, { id: decodedToken.uid, email: decodedToken.email, full_name: fullName, role: 'student', created_at: new Date().toISOString() });
        req.user.fullName = fullName;
      }

    next();
  } catch (error) {
    logger.error({ err: error }, 'Firebase Auth Error');
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional auth - sets user if token present, but doesn't require it
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) { req.user = null; return next(); }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { id: decodedToken.uid, email: decodedToken.email, role: 'student' };

      const profile = await fsdb.getDoc('profiles', decodedToken.uid);
      if (profile) {
        req.user.role = profile.role || 'student';
        req.user.fullName = profile.full_name;
      }
  } catch { req.user = null; }

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
    const user = await fsdb.getDoc('profiles', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, email: user.email, fullName: user.full_name, role: user.role, createdAt: user.created_at });
}));

// Update current user profile
app.put('/api/auth/me', authenticateToken, catchAsync(async (req, res) => {
  const { fullName, role } = req.body;

  if (fullName && fullName.trim().length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters' });
  }

    const updateFields = {};
    if (fullName) updateFields.full_name = fullName;
    if (role && ['student', 'organizer'].includes(role)) {
      const current = await fsdb.getDoc('profiles', req.user.id);
      if (current && current.role === 'student') updateFields.role = role;
    }
    await fsdb.updateDoc('profiles', req.user.id, updateFields);
    return res.json({ message: 'Profile updated successfully' });
}));

// ============= EVENTS ROUTES =============

// Get all events (PUBLIC - no auth required)
app.get('/api/events', optionalAuth, cacheMiddleware(60), catchAsync(async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const isAdmin = req.user && req.user.role === 'admin';
    const isLoggedIn = !!req.user;
    let snapshot;

    if (isAdmin) {
      // Admin sees all events
      let q = fsdb.collection('events');
      if (category && category !== 'all') q = q.where('category', '==', category);
      snapshot = await q.orderBy('created_at', 'desc').get();
    } else {
      // Non-admin: fetch approved events + user's own pending events
      const queries = [];
      let approved = fsdb.collection('events').where('status', '==', 'approved');
      if (category && category !== 'all') approved = approved.where('category', '==', category);
      queries.push(approved.orderBy('created_at', 'desc').get());

      if (isLoggedIn) {
        let own = fsdb.collection('events').where('organizer_id', '==', req.user.id);
        if (category && category !== 'all') own = own.where('category', '==', category);
        queries.push(own.orderBy('created_at', 'desc').get());
      }

      const snapshots = await Promise.all(queries);
      const seen = new Set();
      const allDocs = [];
      for (const snap of snapshots) {
        for (const d of snap.docs) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            allDocs.push(d);
          }
        }
      }
      // Re-sort merged results by created_at desc
      allDocs.sort((a, b) => {
        const aT = a.data().created_at || '';
        const bT = b.data().created_at || '';
        return bT.localeCompare(aT);
      });
      snapshot = { docs: allDocs };
    }

    let events = snapshot.docs.map(d => {
      const e = d.data();
      return {
        id: d.id,
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
        registrationCount: e.registration_count || 0,
        isFull: (e.registration_count || 0) >= e.capacity
      };
    });

    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    const totalCount = events.length;
    const start = (pageNum - 1) * limitNum;
    events = events.slice(start, start + limitNum);

    return res.json({
      data: events,
      pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.ceil(totalCount / limitNum) }
    });
}));

// Get single event (PUBLIC)
app.get('/api/events/:id', optionalAuth, catchAsync(async (req, res) => {
    const doc = await fsdb.getDoc('events', req.params.id);
    if (!doc) return res.status(404).json({ error: 'Event not found' });
    const e = doc;
    const registrationsSnap = await fsdb.collection('registrations').where('event_id', '==', req.params.id).get();
    const registrationCount = registrationsSnap.size;
    const checkedInCount = registrationsSnap.docs.filter(d => d.data().checked_in).length;

    return res.json({
      id: String(e.id),
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
      status: e.status,
      createdAt: e.created_at,
      registrationCount,
      checkedInCount,
      isFull: registrationCount >= e.capacity
    });
}));

// Create event (organizers/admin only)
app.post('/api/events', authenticateToken, requireRole('organizer', 'admin'), validateEventCreation, catchAsync(async (req, res) => {
  const { title, description, location, dateTime, capacity, imageUrl, category, price, currency, recurrenceRule } = req.body;

  const id = uuidv4();
  const seriesId = recurrenceRule ? uuidv4() : null;
  const now = new Date().toISOString();

    const eventData = {
      id, title, description: description || '', location, date_time: dateTime,
      capacity: parseInt(capacity), organizer_id: req.user.id, image_url: imageUrl || '',
      category: category || 'Other', price: price ? parseFloat(price) : 0.00,
      currency: currency || 'usd', recurrence_rule: recurrenceRule || null,
      series_id: seriesId, status: 'pending', created_at: now, registration_count: 0
    };
    await fsdb.setDoc('events', id, eventData);

    if (recurrenceRule) {
      const startDate = new Date(dateTime);
      const now = new Date();
      for (let i = 1; i <= 12; i++) {
        const nextDate = new Date(startDate);
        if (recurrenceRule === 'weekly') nextDate.setDate(nextDate.getDate() + i * 7);
        else if (recurrenceRule === 'biweekly') nextDate.setDate(nextDate.getDate() + i * 14);
        else if (recurrenceRule === 'monthly') nextDate.setMonth(nextDate.getMonth() + i);
        else break;
        if (nextDate <= now) continue;
        const instanceId = uuidv4();
        await fsdb.setDoc('events', instanceId, { ...eventData, id: instanceId, date_time: nextDate.toISOString(), series_id: seriesId, status: 'approved' });
      }
    }

    return res.status(201).json({
      id, title, description: description || '', location, dateTime,
      capacity: parseInt(capacity), organizerId: req.user.id, imageUrl: imageUrl || '',
      category: category || 'Other', price: price ? parseFloat(price) : 0.00,
      currency: currency || 'usd', seriesId, recurrenceRule: recurrenceRule || null
    });
}));

// Update event
app.put('/api/events/:id', authenticateToken, validateEventUpdate, catchAsync(async (req, res) => {
    const event = await fsdb.getDoc('events', req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this event' });
    }
    const { title, description, location, dateTime, capacity, imageUrl, category, price, currency } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (dateTime !== undefined) updates.date_time = dateTime;
    if (capacity !== undefined) updates.capacity = parseInt(capacity);
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = parseFloat(price);
    if (currency !== undefined) updates.currency = currency;
    await fsdb.updateDoc('events', req.params.id, updates);
    return res.json({ message: 'Event updated successfully' });
}));

// Delete event
app.delete('/api/events/:id', authenticateToken, catchAsync(async (req, res) => {
    const event = await fsdb.getDoc('events', req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    await fsdb.deleteDoc('events', req.params.id);
    const regSnap = await fsdb.collection('registrations').where('event_id', '==', req.params.id).get();
    const batch = fsdb.batch();
    regSnap.docs.forEach(d => batch.delete(d.ref));
    if (regSnap.docs.length > 0) await batch.commit();
    return res.json({ message: 'Event deleted successfully' });
}));

// Get organizer's events (authenticated)
app.get('/api/events/my-events', authenticateToken, catchAsync(async (req, res) => {
    const eventsSnap = await fsdb
      .collection('events')
      .where('organizer_id', '==', req.user.id)
      .orderBy('created_at', 'desc')
      .get();

    const events = await Promise.all(eventsSnap.docs.map(async d => {
      const e = d.data();
      const regSnap = await fsdb.collection('registrations').where('event_id', '==', d.id).get();
      const regCount = regSnap.size;
      const checkedIn = regSnap.docs.filter(r => r.data().checked_in).length;
      const totalRevenue = regSnap.docs.reduce((sum, r) => sum + parseFloat(r.data().amount_paid || 0), 0);
      return {
        id: d.id, title: e.title, description: e.description,
        location: e.location, dateTime: e.date_time,
        capacity: e.capacity, price: parseFloat(e.price || 0),
        currency: e.currency || 'usd', status: e.status,
        imageUrl: e.image_url, category: e.category,
        registrationCount: regCount,
        checkedInCount: checkedIn,
        totalRevenue,
        createdAt: e.created_at
      };
    }));

    return res.json(events);
}));

// Get attendees for an event (organizer/admin only)
app.get('/api/events/:id/attendees', authenticateToken, catchAsync(async (req, res) => {
    const eventDoc = await fsdb.getDoc('events', req.params.id);
    if (!eventDoc) return res.status(404).json({ error: 'Event not found' });
    if (eventDoc.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const regSnap = await fsdb
      .collection('registrations')
      .where('event_id', '==', req.params.id)
      .orderBy('registered_at', 'desc')
      .get();

    const profileIds = [...new Set(regSnap.docs.map(r => r.data().user_id))];
    const profileDocs = await Promise.all(profileIds.map(uid => fsdb.getDoc('profiles', uid)));
    const profileMap = {};
    for (const p of profileDocs) {
      if (p) profileMap[p.id] = p;
    }

    const attendees = regSnap.docs.map(a => {
      const d = a.data();
      const prof = profileMap[d.user_id] || {};
      return {
        id: a.id, fullName: prof.full_name || '', email: prof.email || '',
        qrCodeData: d.qr_code_data, checkedIn: d.checked_in,
        checkedInAt: d.checked_in_at || null,
        amountPaid: parseFloat(d.amount_paid || 0),
        registeredAt: d.registered_at
      };
    });

    return res.json({
      event: { id: req.params.id, title: eventDoc.title, capacity: eventDoc.capacity },
      attendees,
      totalAttendees: attendees.length,
      checkedInCount: attendees.filter(a => a.checkedIn).length
    });
}));

// Get per-event analytics (organizer/admin only)
app.get('/api/events/:id/analytics', authenticateToken, catchAsync(async (req, res) => {
    const event = await fsdb.getDoc('events', req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const regSnap = await fsdb.collection('registrations').where('event_id', '==', req.params.id).get();
    const totalReg = regSnap.size;
    const checkedIn = regSnap.docs.filter(d => d.data().checked_in).length;
    const totalRev = regSnap.docs.reduce((s, d) => s + parseFloat(d.data().amount_paid || 0), 0);
    const trend = {};
    regSnap.docs.forEach(d => {
      const date = (d.data().registered_at || '').split('T')[0];
      if (date) trend[date] = (trend[date] || 0) + 1;
    });
    const registrationTrend = Object.entries(trend).sort().map(([date, count]) => ({ date, count }));
    return res.json({
      totalRegistrations: totalReg, checkedInCount: checkedIn, totalRevenue: totalRev,
      registrationTrend, capacity: event.capacity,
      fillRate: event.capacity > 0 ? Math.round((totalReg / event.capacity) * 100) : 0
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
    const e = await fsdb.getDoc('events', req.params.id);
    if (!e) return res.status(404).json({ error: 'Event not found' });
    const calendar = ical({ name: 'City Event', timezone: 'UTC' });
    calendar.createEvent({
      start: new Date(e.date_time), end: new Date(new Date(e.date_time).getTime() + 2 * 60 * 60 * 1000),
      summary: e.title, description: e.description?.substring(0, 200) || '', location: e.location,
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${req.params.id}`,
      organizer: { name: 'City Event' }
    });
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${e.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`);
    return res.send(calendar.toString());
}));

// Event Series — get recurring instances
app.get('/api/series/:seriesId', catchAsync(async (req, res) => {
    const snap = await fsdb.collection('events').where('series_id', '==', req.params.seriesId).orderBy('date_time', 'asc').get();
    return res.json({ seriesId: req.params.seriesId, events: snap.docs.map(d => {
      const e = d.data();
      return { id: d.id, title: e.title, dateTime: e.date_time, location: e.location, capacity: e.capacity, imageUrl: e.image_url, price: parseFloat(e.price || 0) };
    }) });
}));

// ============= TICKET TIERS ROUTES =============

// Get ticket tiers for an event (PUBLIC)
app.get('/api/events/:eventId/ticket-tiers', catchAsync(async (req, res) => {
    const snap = await fsdb.collection('ticket_tiers').where('event_id', '==', req.params.eventId).orderBy('price', 'asc').get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}));

// Create a ticket tier (organizer/admin only)
app.post('/api/events/:eventId/ticket-tiers', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { name, description, price, capacity, availableFrom, availableTo } = req.body;

    const event = await fsdb.getDoc('events', eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    const id = uuidv4();
    await fsdb.setDoc('ticket_tiers', id, { id, event_id: eventId, name, description: description || '', price: parseFloat(price), capacity: parseInt(capacity), available_from: availableFrom || null, available_to: availableTo || null });
    return res.status(201).json({ id, eventId, name, description, price, capacity, availableFrom, availableTo });
}));

// ============= PROMO CODES ROUTES =============

// Create a promo code (organizer/admin only)
app.post('/api/events/:eventId/promo-codes', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { code, discountType, discountValue, maxUses, validFrom, validTo } = req.body;

    const event = await fsdb.getDoc('events', eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    const id = uuidv4();
    await fsdb.setDoc('promo_codes', id, { id, event_id: eventId, code: code.toUpperCase(), discount_type: discountType, discount_value: parseFloat(discountValue), max_uses: maxUses ? parseInt(maxUses) : null, times_used: 0, valid_from: validFrom || null, valid_to: validTo || null });
    return res.status(201).json({ message: 'Promo code created successfully' });
}));

// Validate a promo code (atomic check + increment)
app.post('/api/events/:eventId/validate-promo', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { code } = req.body;

  try {
    const result = await fsdb.runTransaction(async (transaction) => {
      const snap = await fsdb.collection('promo_codes')
        .where('event_id', '==', eventId)
        .where('code', '==', code.toUpperCase())
        .get();
      if (snap.empty) throw new AppError('Invalid promo code', 404);

      const promoRef = snap.docs[0].ref;
      const promoSnap = await transaction.get(promoRef);
      const promo = promoSnap.data();

      const now = new Date();
      if (promo.valid_from && new Date(promo.valid_from) > now) throw new AppError('Promo code not yet active', 400);
      if (promo.valid_to && new Date(promo.valid_to) < now) throw new AppError('Promo code expired', 400);
      if (promo.max_uses !== null && (promo.times_used || 0) >= promo.max_uses) throw new AppError('Promo code limit reached', 400);

      transaction.update(promoRef, { times_used: admin.firestore.FieldValue.increment(1) });

      return { id: promoSnap.id, code: promo.code, discountType: promo.discount_type, discountValue: parseFloat(promo.discount_value) };
    });
    return res.json(result);
  } catch (err) {
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: 'Promo code validation failed' });
  }
}));

// ============= REGISTRATIONS ROUTES =============

// Register for a FREE event (atomic transaction prevents overbooking)
app.post('/api/registrations', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'Event ID required' });

  let registrationResult;
  try {
    registrationResult = await fsdb.runTransaction(async (transaction) => {
      const eventRef = fsdb.collection('events').doc(eventId);
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) throw new AppError('Event not found', 404);
      const event = eventSnap.data();

      if (event.price && parseFloat(event.price) > 0) {
        throw new AppError('This is a paid event. Please proceed to checkout to purchase a ticket.', 400);
      }

      const currentCount = event.registration_count || 0;
      if (currentCount >= event.capacity) throw new AppError('Event is full', 400);

      const existingSnap = await fsdb.collection('registrations')
        .where('event_id', '==', eventId)
        .where('user_id', '==', req.user.id)
        .get();
      if (!existingSnap.empty) throw new AppError('Already registered for this event', 400);

      const qrCodeData = `CITYEVENT-${uuidv4()}`;
      const id = uuidv4();
      const now = new Date().toISOString();
      const regData = {
        id, event_id: eventId, user_id: req.user.id,
        qr_code_data: qrCodeData, checked_in: false,
        checked_in_at: null, amount_paid: 0, registered_at: now
      };

      transaction.set(fsdb.collection('registrations').doc(id), regData);
      transaction.update(eventRef, { registration_count: admin.firestore.FieldValue.increment(1) });

      return { id, eventId, qrCodeData, event: { title: event.title, dateTime: event.date_time, location: event.location } };
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }

  processTicket({ fsdb, registrationId: registrationResult.id, eventId, userId: req.user.id, qrCodeData: registrationResult.qrCodeData, amountPaid: 0 })
    .catch(err => logger.error({ err, registrationId: registrationResult.id }, 'Ticket processing error'));

  return res.status(201).json(registrationResult);
}));

// Helper for operational errors
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Checkout for PAID event (Stripe) — atomic capacity check
app.post('/api/registrations/checkout', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'Event ID required' });

  let eventData;
  try {
    eventData = await fsdb.runTransaction(async (transaction) => {
      const eventRef = fsdb.collection('events').doc(eventId);
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) throw new AppError('Event not found', 404);
      const event = eventSnap.data();

      const currentCount = event.registration_count || 0;
      if (currentCount >= event.capacity) throw new AppError('Event is full', 400);

      const existingSnap = await fsdb.collection('registrations')
        .where('event_id', '==', eventId)
        .where('user_id', '==', req.user.id)
        .get();
      if (!existingSnap.empty) throw new AppError('Already registered for this event', 400);
      if (!event.price || parseFloat(event.price) <= 0) throw new AppError('Use standard registration for free events', 400);

      return event;
    });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: 'Checkout failed' });
  }

  const ticketPrice = parseFloat(eventData.price);
  const platformFee = ticketPrice * 0.05;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      { price_data: { currency: 'usd', product_data: { name: eventData.title, description: `Ticket for ${eventData.title} at ${eventData.location}` }, unit_amount: Math.round(ticketPrice * 100) }, quantity: 1 },
      { price_data: { currency: 'usd', product_data: { name: 'Platform Fee (5%)', description: 'Platform processing fee' }, unit_amount: Math.round(platformFee * 100) }, quantity: 1 }
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets?success=true`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${eventId}?canceled=true`,
    metadata: { eventId, userId: req.user.id }
  });
  return res.json({ url: session.url });
}));

// Get user's tickets
app.get('/api/registrations/my-tickets', authenticateToken, catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const regSnap = await fsdb
      .collection('registrations')
      .where('user_id', '==', req.user.id)
      .orderBy('registered_at', 'desc')
      .get();

    const eventIds = [...new Set(regSnap.docs.map(r => r.data().event_id))];
    const eventDocs = await Promise.all(eventIds.map(eid => fsdb.getDoc('events', String(eid))));
    const eventMap = {};
    for (const ev of eventDocs) {
      if (ev) eventMap[ev.id] = ev;
    }

    let tickets = regSnap.docs.map(r => {
      const d = r.data();
      const ev = eventMap[d.event_id] || {};
      return {
        id: r.id,
        eventId: d.event_id,
        userId: d.user_id,
        qrCodeData: d.qr_code_data,
        checkedIn: d.checked_in,
        checkedInAt: d.checked_in_at || null,
        amountPaid: parseFloat(d.amount_paid || 0),
        registeredAt: d.registered_at,
        event: {
          id: d.event_id,
          title: ev.title || '',
          dateTime: ev.date_time || '',
          location: ev.location || '',
          imageUrl: ev.image_url || ''
        }
      };
    });

    const totalCount = tickets.length;
    const offset = (pageNum - 1) * limitNum;
    tickets = tickets.slice(offset, offset + limitNum);

    return res.json({
      data: tickets,
      pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.ceil(totalCount / limitNum) }
    });
}));

// Get single registration
app.get('/api/registrations/:id', authenticateToken, catchAsync(async (req, res) => {
    const regDoc = await fsdb.getDoc('registrations', req.params.id);
    if (!regDoc) return res.status(404).json({ error: 'Registration not found' });
    if (regDoc.user_id !== req.user.id && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const evDoc = await fsdb.getDoc('events', String(regDoc.event_id));
    return res.json({
      id: regDoc.id,
      eventId: regDoc.event_id,
      userId: regDoc.user_id,
      qrCodeData: regDoc.qr_code_data,
      checkedIn: regDoc.checked_in,
      checkedInAt: regDoc.checked_in_at || null,
      amountPaid: parseFloat(regDoc.amount_paid || 0),
      registeredAt: regDoc.registered_at,
      event: { title: evDoc?.title || '', dateTime: evDoc?.date_time || '', location: evDoc?.location || '', imageUrl: evDoc?.image_url || '' }
    });
}));

// Cancel registration / request refund
app.post('/api/registrations/:id/cancel', authenticateToken, catchAsync(async (req, res) => {
    const reg = await fsdb.getDoc('registrations', req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    const event = await fsdb.getDoc('events', String(reg.event_id));

    let refunded = false;
    if (reg.payment_intent_id && parseFloat(reg.amount_paid || 0) > 0) {
      try { await stripe.refunds.create({ payment_intent: reg.payment_intent_id, reason: 'requested_by_customer' }); refunded = true; }
      catch (err) { logger.error({ err, paymentIntent: reg.payment_intent_id }, 'Refund error'); }
    }

    await fsdb.deleteDoc('registrations', req.params.id);

    const waitlistSnap = await fsdb.collection('waitlist').where('event_id', '==', reg.event_id).orderBy('joined_at', 'asc').limit(1).get();
    if (!waitlistSnap.empty) {
      const next = { id: waitlistSnap.docs[0].id, ...waitlistSnap.docs[0].data() };
      const profile = await fsdb.getDoc('profiles', next.user_id);
      await fsdb.deleteDoc('waitlist', next.id);
      if (profile) {
        import('./services/emailService.js').then(({ sendWaitlistNotification }) => {
          sendWaitlistNotification(profile.email, profile.full_name, event?.title || '');
        }).catch(err => logger.error({ err }, 'Waitlist email error'));
      }
    }

    return res.json({ message: 'Registration cancelled', refunded });
}));

// ============= WAITLIST ROUTES =============

// Join waitlist for a full event
app.post('/api/waitlist', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'Event ID required' });

    const event = await fsdb.getDoc('events', eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const [existing, alreadyReg] = await Promise.all([
      fsdb.collection('waitlist').where('event_id', '==', eventId).where('user_id', '==', req.user.id).get(),
      fsdb.collection('registrations').where('event_id', '==', eventId).where('user_id', '==', req.user.id).get()
    ]);
    if (!existing.empty) return res.status(400).json({ error: 'Already on waitlist' });
    if (!alreadyReg.empty) return res.status(400).json({ error: 'Already registered' });
    const id = uuidv4();
    await fsdb.setDoc('waitlist', id, { id, event_id: eventId, user_id: req.user.id, joined_at: new Date().toISOString() });
    return res.status(201).json({ id, eventId, userId: req.user.id });
}));

// Leave waitlist
app.delete('/api/waitlist/:eventId', authenticateToken, catchAsync(async (req, res) => {
    const snap = await fsdb.collection('waitlist').where('event_id', '==', req.params.eventId).where('user_id', '==', req.user.id).get();
    if (!snap.empty) await fsdb.deleteDoc('waitlist', snap.docs[0].id);
    return res.json({ message: 'Removed from waitlist' });
}));

// Check waitlist status for an event
app.get('/api/waitlist/:eventId/status', authenticateToken, catchAsync(async (req, res) => {
    const snap = await fsdb.collection('waitlist').where('event_id', '==', req.params.eventId).where('user_id', '==', req.user.id).get();
    return res.json({ onWaitlist: !snap.empty, joinedAt: snap.empty ? null : snap.docs[0].data().joined_at });
}));

// Get user's waitlist entries
app.get('/api/waitlist/my-list', authenticateToken, catchAsync(async (req, res) => {
    const snap = await fsdb.collection('waitlist').where('user_id', '==', req.user.id).orderBy('joined_at', 'desc').get();
    const eventIds = [...new Set(snap.docs.map(d => d.data().event_id))];
    const eventDocs = await Promise.all(eventIds.map(eid => fsdb.getDoc('events', eid)));
    const eventMap = {};
    for (const ev of eventDocs) { if (ev) eventMap[ev.id] = ev; }
    const entries = snap.docs.map(d => {
      const w = d.data();
      const ev = eventMap[w.event_id] || {};
      return { id: d.id, eventId: w.event_id, joinedAt: w.joined_at, event: { title: ev.title, dateTime: ev.date_time, location: ev.location, imageUrl: ev.image_url } };
    });
    return res.json(entries);
}));

// Stripe Customer Portal (saved payment methods)
app.post('/api/billing/portal', authenticateToken, catchAsync(async (req, res) => {
    let customerId;
    const profile = await fsdb.getDoc('profiles', req.user.id);
    if (profile && profile.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({ email: profile?.email, name: profile?.full_name, metadata: { userId: req.user.id } });
      customerId = customer.id;
      await fsdb.updateDoc('profiles', req.user.id, { stripe_customer_id: customerId });
    }
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets` });
    return res.json({ url: session.url });
}));

// ============= CHECK-IN ROUTES =============

// Scan QR code and check-in
app.post('/api/checkin/scan', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
  const { qrCodeData, eventId } = req.body;
  if (!qrCodeData) return res.status(400).json({ error: 'QR code data required' });

    const snap = await fsdb.collection('registrations').where('qr_code_data', '==', qrCodeData).get();
    if (snap.empty) return res.status(404).json({ success: false, error: 'Invalid ticket', message: 'This QR code is not valid' });
    const reg = { id: snap.docs[0].id, ...snap.docs[0].data() };
    if (eventId && String(reg.event_id) !== eventId) return res.status(400).json({ success: false, error: 'Wrong event', message: 'This ticket is for a different event' });
    if (reg.checked_in) return res.status(400).json({ success: false, error: 'Already checked in', message: 'Already checked in' });

    const profile = await fsdb.getDoc('profiles', reg.user_id);
    const eventDoc = await fsdb.getDoc('events', String(reg.event_id));
    const now = new Date().toISOString();
    await fsdb.updateDoc('registrations', reg.id, { checked_in: true, checked_in_at: now });

    return res.json({
      success: true, message: 'Check-in successful!',
      registration: { id: reg.id, user: { id: reg.user_id, fullName: profile?.full_name || '', email: profile?.email || '' }, event: { id: reg.event_id, title: eventDoc?.title || '', location: eventDoc?.location || '' } }
    });
}));

// Get check-in stats for an event
app.get('/api/checkin/event/:eventId', authenticateToken, requireRole('organizer', 'admin'), catchAsync(async (req, res) => {
    const event = await fsdb.getDoc('events', req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

    const regSnap = await fsdb.collection('registrations').where('event_id', '==', req.params.eventId).get();
    const userIds = [...new Set(regSnap.docs.map(d => d.data().user_id))];
    const profileDocs = await Promise.all(userIds.map(uid => fsdb.getDoc('profiles', uid)));
    const profileMap = {};
    for (const p of profileDocs) { if (p) profileMap[p.id] = p; }

    const registrations = regSnap.docs.map(d => {
      const r = d.data();
      const prof = profileMap[r.user_id] || {};
      return { id: d.id, userName: prof.full_name || 'Unknown', userEmail: prof.email || '', checkedIn: r.checked_in, checkedInAt: r.checked_in_at, registeredAt: r.registered_at };
    });
    const checkedIn = registrations.filter(r => r.checkedIn);

    return res.json({ event: { id: req.params.eventId, title: event.title, capacity: event.capacity }, totalRegistrations: registrations.length, checkedInCount: checkedIn.length, capacity: event.capacity, attendees: registrations });
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
    const snap = await fsdb.collection('profiles').orderBy('created_at', 'desc').get();
    return res.json(snap.docs.map(u => {
      const d = u.data();
      return { id: u.id, email: d.email, fullName: d.full_name, role: d.role, createdAt: d.created_at };
    }));
}));

// Update user role
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'organizer', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    await fsdb.updateDoc('profiles', req.params.id, { role });
    return res.json({ message: 'Role updated successfully' });
}));

// Get pending events (admin moderation)
app.get('/api/admin/events/pending', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
    const snap = await fsdb.collection('events').where('status', '==', 'pending').orderBy('created_at', 'asc').get();
    const organizerIds = [...new Set(snap.docs.map(d => d.data().organizer_id))];
    const profiles = await Promise.all(organizerIds.map(oid => fsdb.getDoc('profiles', oid)));
    const nameMap = {};
    for (const p of profiles) { if (p) nameMap[p.id] = p.full_name; }
    return res.json(snap.docs.map(d => {
      const e = d.data();
      return { id: d.id, title: e.title, description: e.description, location: e.location, dateTime: e.date_time, capacity: e.capacity, organizerId: e.organizer_id, organizerName: nameMap[e.organizer_id] || '', imageUrl: e.image_url, category: e.category, price: parseFloat(e.price || 0), status: e.status, createdAt: e.created_at };
    }));
}));

// Approve or reject event
app.put('/api/admin/events/:id/status', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
    await fsdb.updateDoc('events', req.params.id, { status });
    return res.json({ message: `Event ${status} successfully` });
}));

// Get platform analytics
app.get('/api/admin/analytics', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
    const [usersSnap, eventsSnap, regSnap] = await Promise.all([
      fsdb.collection('profiles').get(), fsdb.collection('events').get(), fsdb.collection('registrations').get()
    ]);
    const totalRevenue = regSnap.docs.reduce((s, d) => s + parseFloat(d.data().amount_paid || 0), 0);
    return res.json({ totalUsers: usersSnap.size, totalEvents: eventsSnap.size, totalRegistrations: regSnap.size, totalRevenue });
}));

// ============= REVIEWS ROUTES =============

// Get reviews for an event (PUBLIC)
app.get('/api/events/:eventId/reviews', catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const snap = await fsdb.collection('reviews').where('event_id', '==', eventId).orderBy('created_at', 'desc').get();
    const userIds = [...new Set(snap.docs.map(d => d.data().user_id))];
    const profiles = await Promise.all(userIds.map(uid => fsdb.getDoc('profiles', uid)));
    const nameMap = {};
    for (const p of profiles) { if (p) nameMap[p.id] = p.full_name; }
    let allReviews = snap.docs.map(d => {
      const r = d.data();
      return { id: d.id, eventId: r.event_id, userId: r.user_id, userName: nameMap[r.user_id] || '', rating: r.rating, comment: r.comment, createdAt: r.created_at };
    });
    const totalCount = allReviews.length;
    const offset = (pageNum - 1) * limitNum;
    allReviews = allReviews.slice(offset, offset + limitNum);
    return res.json({ data: allReviews, pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.ceil(totalCount / limitNum) } });
}));

// Get review statistics for an event (PUBLIC)
app.get('/api/events/:eventId/reviews/stats', catchAsync(async (req, res) => {
  const { eventId } = req.params;

    const snap = await fsdb.collection('reviews').where('event_id', '==', eventId).get();
    const ratings = snap.docs.map(d => d.data().rating);
    const total = ratings.length;
    if (total === 0) return res.json({ totalReviews: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    const sum = ratings.reduce((a, b) => a + b, 0);
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { if (dist[r] !== undefined) dist[r]++; });
    return res.json({ totalReviews: total, averageRating: sum / total, distribution: dist });
}));

// Submit a review for an event (authenticated)
app.post('/api/events/:eventId/reviews', authenticateToken, catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  if (!comment || comment.trim().length < 2) return res.status(400).json({ error: 'Comment must be at least 2 characters' });

    const event = await fsdb.getDoc('events', eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const existingSnap = await fsdb.collection('reviews').where('event_id', '==', eventId).where('user_id', '==', req.user.id).get();
    if (!existingSnap.empty) return res.status(400).json({ error: 'You have already reviewed this event' });
    const id = uuidv4();
    await fsdb.setDoc('reviews', id, { id, event_id: eventId, user_id: req.user.id, rating, comment: comment.trim(), created_at: new Date().toISOString() });
    return res.status(201).json({ id, eventId, rating, comment, userId: req.user.id });
}));

// Delete own review
app.delete('/api/events/:eventId/reviews/:reviewId', authenticateToken, catchAsync(async (req, res) => {
  const { eventId, reviewId } = req.params;

    const review = await fsdb.getDoc('reviews', reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    await fsdb.deleteDoc('reviews', reviewId);
    return res.json({ message: 'Review deleted successfully' });
}));

// ============= GDPR ROUTES =============

// Export all user data (GDPR Article 20)
app.get('/api/gdpr/export', authenticateToken, catchAsync(async (req, res) => {
    const profile = await fsdb.getDoc('profiles', req.user.id);
    const [regSnap, reviewsSnap, waitlistSnap] = await Promise.all([
      fsdb.collection('registrations').where('user_id', '==', req.user.id).get(),
      fsdb.collection('reviews').where('user_id', '==', req.user.id).get(),
      fsdb.collection('waitlist').where('user_id', '==', req.user.id).get()
    ]);
    const eventIds = [...new Set(regSnap.docs.map(d => d.data().event_id))];
    const eventDocs = await Promise.all(eventIds.map(eid => fsdb.getDoc('events', String(eid))));
    const eventMap = {};
    for (const ev of eventDocs) { if (ev) eventMap[ev.id] = ev; }
    const registrations = regSnap.docs.map(d => {
      const r = d.data();
      const ev = eventMap[r.event_id] || {};
      return { ...r, id: d.id, title: ev.title, date_time: ev.date_time, location: ev.location };
    });
    const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const waitlist = waitlistSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ exportedAt: new Date().toISOString(), profile, registrations, reviews, waitlist });
}));

// Delete user account and all data (GDPR Article 17 - Right to erasure)
app.delete('/api/gdpr/delete-account', authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Delete Firebase Auth user FIRST — if this fails, abort before deleting data
  try { await admin.auth().deleteUser(userId); }
  catch (err) {
    if (err.code === 'auth/user-not-found') {
      logger.warn({ userId }, 'Firebase auth user already deleted');
    } else {
      logger.error({ err, userId }, 'Failed to delete Firebase auth user');
      return res.status(500).json({ error: 'Account deletion failed. Please try again or contact support.' });
    }
  }

  // Delete user data from Firestore
  const collections = ['reviews', 'waitlist', 'registrations'];
  for (const col of collections) {
    const snap = await fsdb.collection(col).where('user_id', '==', userId).get();
    if (!snap.empty) {
      const batch = fsdb.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }
  const eventsSnap = await fsdb.collection('events').where('organizer_id', '==', userId).get();
  if (!eventsSnap.empty) {
    const batch = fsdb.batch();
    eventsSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await fsdb.deleteDoc('profiles', userId);

  res.json({ message: 'Account and all associated data permanently deleted' });
}));

// ============= TICKET PDF DOWNLOAD =============

// Download ticket as PDF
app.get('/api/tickets/:id/pdf', authenticateToken, catchAsync(async (req, res) => {
    const reg = await fsdb.getDoc('registrations', req.params.id);
    if (!reg) return res.status(404).json({ error: 'Ticket not found' });
    if (reg.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    const [event, profile] = await Promise.all([
      fsdb.getDoc('events', String(reg.event_id)),
      fsdb.getDoc('profiles', reg.user_id)
    ]);
    const { generateTicketPdf } = await import('./services/pdfService.js');
    const pdfBuffer = await generateTicketPdf({
      attendeeName: profile?.full_name || '',
      eventTitle: event?.title || '',
      eventDate: new Date(event?.date_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      eventLocation: event?.location || '',
      qrCodeDataUrl: null, ticketId: req.params.id, amountPaid: parseFloat(reg.amount_paid || 0),
    });
    if (!pdfBuffer) return res.status(503).json({ error: 'PDF generation unavailable. Please view your ticket on the My Tickets page.' });
    const fileName = `${(event?.title || 'ticket').replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
}));

// ============= HEALTH CHECK =============

app.get('/api/health', catchAsync(async (req, res) => {
    let users = 0, events = 0, registrations = 0;
    try {
      const [u, e, r] = await Promise.all([
        fsdb.collection('profiles').get(), fsdb.collection('events').get(), fsdb.collection('registrations').get()
      ]);
      users = u.size; events = e.size; registrations = r.size;
    } catch { /* allow partial stats */ }
    return res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected', stats: { users, events, registrations } });
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

export const api = onRequest(app);
