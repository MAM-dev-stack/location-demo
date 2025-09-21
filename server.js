const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('basic-auth');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors()); // در تولید محدودش کن بر اساس origin
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'locations.json');
let locations = [];
try {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  locations = raw ? JSON.parse(raw) : [];
} catch (e) {
  locations = [];
}

function saveToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(locations, null, 2));
  } catch (e) {
    console.error('Error saving locations:', e);
  }
}

// Helper: sanitize minimal fields for responses
function sanitizeEntry(e) {
  return {
    id: e.id,
    lat: e.lat,
    lon: e.lon,
    accuracy: e.accuracy,
    ts: e.ts
  };
}

// PUBLIC API: receive location (must be sent only after explicit consent on client)
app.post('/api/location', (req, res) => {
  const { lat, lon, accuracy, ts, consentToken } = req.body || {};

  // Basic safety checks
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return res.status(400).json({ ok: false, error: 'bad_payload' });
  }

  // Optionally check a consent token or flag from client if you implement one.
  // Here we just trust client indicates consent; production: validate session/auth + server-side consent record.
  const entry = {
    id: Date.now() + '-' + Math.floor(Math.random() * 10000),
    lat,
    lon,
    accuracy: typeof accuracy === 'number' ? accuracy : null,
    ts: ts || new Date().toISOString(),
    ua: req.get('User-Agent') || '',
    ip: req.ip || req.connection.remoteAddress
  };

  locations.push(entry);
  saveToDisk();

  res.status(201).json({ ok: true, id: entry.id });
});

// PUBLIC API: delete all locations for a user id (client must supply id or token). For demo we allow deleting by id list or by matching ip (very naive).
app.post('/api/delete-my-locations', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ ok: false, error: 'ids_required' });

  const before = locations.length;
  locations = locations.filter(l => !ids.includes(l.id));
  saveToDisk();
  res.json({ ok: true, removed: before - locations.length });
});

// ADMIN AUTH (very simple). In production use env vars and real auth (sessions/JWT/OAuth).
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

function requireAdmin(req, res, next) {
  const user = basicAuth(req);
  if (!user || user.name !== ADMIN_USER || user.pass !== ADMIN_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Unauthorized');
  }
  next();
}

// Admin: return all locations (admin-only)
app.get('/admin/locations', requireAdmin, (req, res) => {
  res.json(locations);
});

// Admin page (static file in public/admin.html) served with requireAdmin check by route wrapper
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
