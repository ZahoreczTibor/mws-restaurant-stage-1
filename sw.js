//code implemented following Lab: Caching Files with Service Worker from developers.google.com
const CACHE_NAME = 'mws-restaurant-stage-2';
const CACHED_URLS = [
 // Our HTML
'/index.html',
// Stylesheets
'./css/styles.css',
// JavaScript
'./js/main.js',
'./js/restaurant_info.js',
'./js/dbhelper.js',
'./data/restaurants.json',
// Images
'./img/1.jpg',
'./img/2.jpg',
'./img/3.jpg',
'./img/4.jpg',
'./img/5.jpg',
'./img/6.jpg',
'./img/7.jpg',
'./img/8.jpg',
'./img/9.jpg',
'./img/10.jpg'
];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(CACHED_URLS);
        })
    );
});

self.addEventListener("fetch", function(event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request).then(function(response) {
                if (response) {
                    return response;
                } else if (event.request.headers.get("accept").includes("text/html"
                    return caches.match("/index.html");
                 }
            });
        })
    );
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (CACHE_NAME !== cacheName && cacheName.startsWith("gih-cache"
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

addEventListener('activate', function (event) {
    return delete_caches(event);
});

addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
              .then(function (response) {
                  // comments from Mozilla MDN
                  // caches.match() always resolves
                  // but in case of success response will have value
                  if (response !== void 0) {
                      return response;
                  } else {
                      return fetch(event.request)
                          .then((response) => {
                              let responseClone;
                              // response may be used only once
                              // we need to save clone to put one copy in cache
                              // and serve second one
                              if (response && response.url) {
                                  responseClone = response.clone();
                                  caches
                                      .open(cache_name)
                                      .then((cache) => {
                                                cache.put(event.request, responseClone);
                                            }
                                      );
                              }
                              return response;
                          }).catch(function (err) {
                              console.log(err);
                              return response
                          });
                  }
              }));
});

addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
        return this.skipWaiting();
    }
});