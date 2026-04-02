import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routes/index.js';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// FIXED 1: Changed `import crypto from "crypto"` to `import crypto from "node:crypto"`.
// With "type": "module" in package.json, Node resolves bare specifiers differently.
// The npm `crypto` shim package (which you have installed) intercepts the bare
// "crypto" specifier before Node's built-in, and that shim does not work in ES
// modules — hence "ReferenceError: crypto is not defined". The "node:" prefix
// forces Node to skip npm packages entirely and go straight to the built-in,
// which always works regardless of what's installed in node_modules.
// You can also safely run: npm uninstall crypto (the shim is no longer needed).
import crypto from 'node:crypto';

// FIXED 2: Added __filename and __dirname shims.
// These globals don't exist in ES modules — they're CommonJS-only. Without this,
// `path.join(__dirname, 'client/build')` in the production block below would throw
// "ReferenceError: __dirname is not defined" at runtime in production.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ── JWT Secret Validation ─────────────────────────────────────────────────────
// Ensure required secrets are set before starting the server
const requiredSecrets = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

if (missingSecrets.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingSecrets.join(', ')}`);
  console.error('Please add these to your .env file.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5001;

var allowlist = process.env.ALLOW_LIST || 'http://localhost:3000';

var corsOptionsDelegate = function (req, callback) {
    var corsOptions = {
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
      optionsSuccessStatus: 200
    };

    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true, credentials: true };
    } else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

// ── Shared cookie configuration ───────────────────────────────────────────────
// Keep these names in sync with the client-side COOKIE_KEYS in cookieUtils.js.
export const COOKIE_KEYS = {
    SESSION_ID: 'sessionId',
    USER_ID:    'user_id',
};

export const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge:   parseInt(process.env.COOKIE_MAX_AGE) || 1000 * 60 * 60 * 24 * 7, // 7 days
    path:     '/',
};

// ── Cookie-seeding middleware ─────────────────────────────────────────────────
// Seeds a sessionId on every request.
// user_id should be set explicitly by your auth/login routes via:
//   res.cookie(COOKIE_KEYS.USER_ID, id, cookieOptions)
const seedCookies = (req, res, next) => {
    if (!req.cookies?.[COOKIE_KEYS.SESSION_ID]) {
        // crypto.randomUUID() is available on all Node versions >= 14.17.0
        const sessionId = crypto.randomUUID();
        res.cookie(COOKIE_KEYS.SESSION_ID, sessionId, cookieOptions);
    }
    next();
};

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors(corsOptionsDelegate));
app.use(express.json());
app.use(cookieParser());
app.use(seedCookies);

app.use('/api', router);

// Proxy endpoint — returns the client's public IP via ipify.
// Note: in production behind Nginx, req.ip will already contain the real client
// IP from X-Forwarded-For, so this endpoint is only needed for client-side callers.
app.get('/proxy', async (req, res) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Server Error With API');
    }
});

// ── Production static file serving ───────────────────────────────────────────
// FIXED 2 (continued): __dirname now defined above via fileURLToPath shim.
// Without that shim this block would crash with ReferenceError in production.
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build/index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
