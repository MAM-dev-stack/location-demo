const SERVER_BASE = ''; // اگر اپ در همان دامنه باشه خالی بذار
const map = L.map('map').setView([35.7, 51.4], 5); // موقعیت اولیه نقشه

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const locPanel = document.getElementById('locPanel');
const allowBtn = document.getElementById('allowBtn');
const denyBtn = document.getElementById('denyBtn');
const statusText = document.getElementById('statusText');

function showStatus(t) {
  statusText.textContent = t;
}

let userMarker, accuracyCircle;

async function sendLocation(lat, lon, acc) {
  try {
    const payload = { lat, lon, accuracy: acc, ts: new Date().toISOString() };
    const res = await fetch(SERVER_BASE + '/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      showStatus('خطا در ارسال موقعیت به سرور.');
      return;
    }
    showStatus('موقعیت شما ارسال شد ✅');
  } catch (e) {
    console.error(e);
    showStatus('خطا در ارسال موقعیت.');
  }
}

function handleSuccess(pos) {
  const lat = pos.coords.latitude, lon = pos.coords.longitude, acc = pos.coords.accuracy;
  
  if (userMarker) userMarker.remove();
  if (accuracyCircle) accuracyCircle.remove();
  
  // ایجاد نشانگر با آیکون پیش‌فرض
  userMarker = L.marker([lat, lon]).addTo(map)
    .bindPopup('شما اینجا هستید')
    .openPopup();
  
  accuracyCircle = L.circle([lat, lon], { radius: acc }).addTo(map);
  map.setView([lat, lon], 14, { animate: true });
  showStatus('موقعیت پیدا شد — دقت: ' + Math.round(acc) + ' متر');
  sendLocation(lat, lon, acc);
  setTimeout(() => locPanel.style.display = 'none', 700);
}

function handleError(err) {
  console.warn(err);
  if (err.code === 1) showStatus('دسترسی رد شد — از تنظیمات مرورگر می‌تونی تغییرش بدی.');
  else if (err.code === 2) showStatus('موقعیت در دسترس نیست.');
  else if (err.code === 3) showStatus('درخواست تایم‌اوت شد.');
  else showStatus('خطا در دریافت موقعیت.');
  setTimeout(() => locPanel.style.display = 'none', 1500);
}

allowBtn.addEventListener('click', () => {
  showStatus('در حال درخواست موقعیت از مرورگر...');
  if (!('geolocation' in navigator)) {
    showStatus('مرورگرت از Geolocation پشتیبانی نمی‌کنه.');
    return;
  }
  navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { enableHighAccuracy: true, timeout: 10000 });
});

denyBtn.addEventListener('click', () => {
  showStatus('بدون دسترسی هم می‌توانید ادامه دهید؛ اما بعضی خدمات محدود خواهند شد.');
  setTimeout(() => locPanel.style.display = 'none', 800);
});
