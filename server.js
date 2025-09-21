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

// Middleware برای تأیید توکن
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
