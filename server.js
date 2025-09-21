// server.js
// npm init -y
// npm i express basic-auth
const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('basic-auth');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'locations.json');
let locations = [];
try { 
  locations = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]'); 
} catch (e) { 
  locations = []; 
}

function save() { 
  fs.writeFileSync(DATA_FILE, JSON.stringify(locations, null, 2)); 
}

// POST /api/location  -- ذخیره‌ی لوکیشن با رضایت کاربر
app.post('/api/location', (req, res) => {
  const { lat, lon, accuracy, ts } = req.body || {};
  if (typeof lat !== 'number' || typeof lon !== 'number') return res.status(400).send('bad payload');
  
  const entry = {
    id: Date.now() + '-' + Math.floor(Math.random() * 10000),
    lat, lon, accuracy: accuracy || null, ts: ts || new Date().toISOString(),
    ua: req.get('User-Agent') || '', ip: req.ip
  };
  
  locations.push(entry);
  save();
  res.status(201).json({ ok: true, id: entry.id });
});

// POST /api/optout   -- اگر کاربر می‌خواد لغو کنه (یا از سمت frontend فراخوانی شه)
app.post('/api/optout', (req, res) => {
  // در اپ واقعی باید شناسهٔ کاربر یا session داشته باشی؛ اینجا دموست
  // می‌تونی بر اساس ip یا توکن حذف/flag کنی
  res.json({ ok: true, msg: 'opt-out recorded (demo)' });
});

// احراز هویت ساده برای admin (برای دمو فقط)
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

// صفحه ادمین
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/admin/locations', requireAdmin, (req, res) => res.json(locations));

// حذف موقعیت بر اساس id (ادمین)
app.delete('/admin/locations/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const before = locations.length;
  locations = locations.filter(l => l.id !== id);
  save();
  res.json({ ok: true, removed: before - locations.length });
});

// تعریف پورت یک بار
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// صفحه اصلی (root)
app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});
