const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken'); // JWT برای احراز هویت
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

// ایجاد اتصال به پایگاه داده MongoDB
mongoose.connect('mongodb://localhost/kodiab', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// تعریف مدل برای موقعیت
const Location = mongoose.model('Location', new mongoose.Schema({
  lat: Number,
  lon: Number,
  accuracy: Number,
  ts: String,
  ua: String,
  ip: String
}));

const app = express();
app.use(helmet()); // امنیت بیشتر
app.use(express.json());
app.use(cors()); // در تولید محدودش کن بر اساس origin
app.use(express.static(path.join(__dirname, 'public')));

// توکن JWT را برای احراز هویت بررسی می‌کنیم
const SECRET_KEY = 'your_secret_key'; // باید این کلید را امن نگه دارید

function verifyToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(400).json({ error: 'Invalid token.' });
    }
    req.user = decoded; // ذخیره اطلاعات کاربر در درخواست
    next();
  });
}

// ثبت نام و ورود به سیستم با JWT
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // برای نمونه: اعتبارسنجی ساده برای کاربر و پسورد
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

// دریافت موقعیت از کاربر و ذخیره در MongoDB
app.post('/api/location', verifyToken, async (req, res) => {
  const { lat, lon, accuracy, ts } = req.body;

  // اعتبارسنجی داده‌ها
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return res.status(400).json({ ok: false, error: 'bad_payload' });
  }

  const entry = new Location({
    lat,
    lon,
    accuracy: typeof accuracy === 'number' ? accuracy : null,
    ts: ts || new Date().toISOString(),
    ua: req.get('User-Agent') || '',
    ip: req.ip || req.connection.remoteAddress
  });

  try {
    await entry.save();
    res.status(201).json({ ok: true, id: entry._id });
  } catch (e) {
    console.error('Error saving location:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// حذف موقعیت‌های کاربر از طریق شناسه
app.post('/api/delete-my-locations', verifyToken, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ ok: false, error: 'ids_required' });

  try {
    const deleted = await Location.deleteMany({ _id: { $in: ids } });
    res.json({ ok: true, removed: deleted.deletedCount });
  } catch (e) {
    console.error('Error deleting locations:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// مسیر مدیریت فقط برای ادمین
app.get('/admin/locations', verifyToken, (req, res) => {
  if (req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  Location.find()
    .then(locations => res.json(locations))
    .catch(err => res.status(500).json({ error: 'Failed to fetch locations' }));
});

// صفحه مدیریت
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
