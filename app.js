import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// "node:" prefix forces Node's built-in crypto rather than any npm package named "crypto".
import crypto from 'node:crypto';
import router from './routes/index.js';

// The Express app, without starting a server or connecting to the database.
// index.js starts it for real; the tests in /tests import it directly.

// __filename / __dirname don't exist in ES modules — needed for the production static path below.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Behind Nginx, req.ip should be the real client IP from X-Forwarded-For.
// Only trust a proxy running on this machine, so clients can't spoof the header.
app.set('trust proxy', 'loopback');

// ── Shared cookie configuration ───────────────────────────────────────────────
// Keep these names in sync with the client-side COOKIE_KEYS in cookieUtils.js.
export const COOKIE_KEYS = {
    SESSION_ID: 'sessionId',
};

export const cookieOptions = {
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge:   parseInt(process.env.COOKIE_MAX_AGE) || 1000 * 60 * 60 * 24 * 7, // 7 days
    path:     '/',
};

// ── Cookie-seeding middleware ─────────────────────────────────────────────────
// Every visitor gets an httpOnly sessionId; guest carts are keyed by it.
const seedCookies = (req, res, next) => {
    if (!req.cookies?.[COOKIE_KEYS.SESSION_ID]) {
        const sessionId = crypto.randomUUID();
        res.cookie(COOKIE_KEYS.SESSION_ID, sessionId, cookieOptions);
        // Make it visible to this request too, not just the next one.
        req.cookies[COOKIE_KEYS.SESSION_ID] = sessionId;
    }
    next();
};

// ── CORS ──────────────────────────────────────────────────────────────────────
// CLIENT_ORIGIN is a comma-separated list, e.g.
//   CLIENT_ORIGIN=http://localhost:3000,http://ec2-xx-xx-xx-xx.compute-1.amazonaws.com
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ── HTTPS (TODO 10) ───────────────────────────────────────────────────────────
// Set FORCE_HTTPS=true in production once the site has a certificate. Behind Nginx,
// req.secure reflects X-Forwarded-Proto (trust proxy is set above), so plain-HTTP
// requests are redirected to HTTPS and browsers are told to stick to HTTPS (HSTS).
const forceHttps = isProduction && process.env.FORCE_HTTPS === 'true';

if (forceHttps) {
  app.use((req, res, next) => {
    if (req.secure) return next();
    res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// Security headers. contentSecurityPolicy is off for now: a strict CSP would need the
// Square, PayPal, imgur, ipapi and OpenCage origins listed first (see TODO 10b).
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // Let the React dev server (another port) load images/JSON from the API.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: forceHttps ? { maxAge: 60 * 60 * 24 * 180, includeSubDomains: true } : false,
}));

// ── Middlewares ───────────────────────────────────────────────────────────────
if (!isProduction && process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.originalUrl);
    next();
  });
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(seedCookies);
app.use('/api', router);

// ── Production static file serving ───────────────────────────────────────────
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'client/build')));
    // Express 5 needs a named wildcard ("*" alone is no longer valid).
    app.get('/*splat', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build/index.html'));
    });
}

export default app;
