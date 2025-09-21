document.addEventListener("DOMContentLoaded", function() {
  const map = L.map('map').setView([35.7, 51.4], 5); // موقعیت اولیه نقشه

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // در صورتی که کاربر اجازه موقعیت را بدهد
  function showUserLocation(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    map.setView([lat, lon], 12); // زوم به موقعیت کاربر
    L.marker([lat, lon]).addTo(map)
      .bindPopup('موقعیت شما')
      .openPopup();
  }

  // در صورتی که کاربر اجازه موقعیت ندهد
  function handleLocationError() {
    document.getElementById("statusText").innerText = "موقعیت شما قابل دسترسی نیست.";
  }

  // درخواست موقعیت
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showUserLocation, handleLocationError);
  } else {
    document.getElementById("statusText").innerText = "موقعیت جغرافیایی در دسترس نیست.";
  }

  // دکمه‌ها برای اجازه یا رد دسترسی
  document.getElementById("allowBtn").addEventListener("click", function() {
    navigator.geolocation.getCurrentPosition(showUserLocation, handleLocationError);
    document.getElementById("locPanel").style.display = "none"; // مخفی کردن پنل بعد از اجازه
  });

  document.getElementById("denyBtn").addEventListener("click", function() {
    document.getElementById("statusText").innerText = "دسترسی رد شد.";
    document.getElementById("locPanel").style.display = "none"; // مخفی کردن پنل بعد از رد دسترسی
  });
});
