// TripKit Service Worker — chỉ lo việc app MỞ LÊN ĐƯỢC khi không có mạng
// (cache lại chính trang index.html). KHÔNG can thiệp vào việc đồng bộ dữ
// liệu (push/pull tới Apps Script) — việc đó vẫn cần mạng như bình thường,
// dữ liệu đã tải trước đó vẫn xem được nhờ localStorage của trình duyệt.

const CACHE_NAME = 'tripkit-shell-v1';
const SHELL_URL = './index.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Chỉ can thiệp vào việc TẢI TRANG CHÍNH (navigation) — mọi request khác
  // (gọi API tới Apps Script, tải ảnh Drive...) đi thẳng ra mạng như bình
  // thường, không qua cache, để luôn lấy dữ liệu mới nhất.
  if (req.mode !== 'navigate') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, resClone));
        return res;
      })
      .catch(() => caches.match(SHELL_URL))
  );
});
