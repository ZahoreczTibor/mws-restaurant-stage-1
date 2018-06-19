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

self.addEventListener('activate', function(event) {
    console.log('Service worker activating...');
});


self.addEventListener('fetch', function(event) {
    console.log('Service worker is fetching: ', event.request.url);
      event.respondWith(
        caches.match(event.request, { "ignoreSearch": "true" }).then(function(response) {
          
          var promiseIndexedDB = function(url) {
            console.log('Checking indexedDB for url: ' + url);
            return new Promise(function(resolve, reject) {
              if (url.includes("http://localhost:1337/restaurants") && !url.includes("is_favorite"))
              {
                console.log('Using indexDB for url: ' + url);

                const indexedDBName = 'mws-restaurant-db-v1';
                const storeName = 'mws-restaurant-store-v1';
                const request = indexedDB.open(indexedDBName, 1 );

                request.onerror = function(event) {
                    reject(request.error);
                }

                request.onupgradeneeded = function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore(storeName, {keyPath: "id"});

                    console.log('IndexedDB is empty - need to fetch data');
                    fetch('http://localhost:1337/restaurants').then(function(response) {
                         var reply = response.clone();
                         reply.json().then(function(data) {
                           console.log('Service worker is adding ' + reply.url + ' to indexed database: ', data);

                           const indexedDBName = 'mws-restaurant-db-v1';
                           const storeName = 'mws-restaurant-store-v1';
                           const request = indexedDB.open(indexedDBName, 1 );

                           request.onupgradeneeded = function(event) {
                               var db = event.target.result;
                               var store = db.createObjectStore(storeName, {keyPath: "id"});
                           };

                           request.onsuccess = function(event) {
                               
                               data.forEach(function (item) {
                                 fetch('http://localhost:1337/reviews/?restaurant_id=' + item.id).then(function(response2) {
                                   var reply2 = response2.clone();
                                   reply2.json().then(function(data2) {
                                     console.log('Service worker is adding ' + reply2.url + ' to indexed database: ', data2);
                                     data2.forEach(function (item2) {
                                       console.log('IndexedDB adding review ' + JSON.stringify(item2));
                                     });
                                     item.reviews = data2;
                                     console.log('IndexedDB adding restaurant ' + JSON.stringify(item));

                                     var db = event.target.result;
                                     var tx = db.transaction(storeName, "readwrite");
                                     var store = tx.objectStore(storeName);
                                     store.put(item);
                                   });
                                 });
                                 
                               })
                           }
                         })
                    });
                };

                request.onsuccess = function(event) {
                    var db = event.target.result;
                    var tx = db.transaction(storeName, "readwrite");
                    var store = tx.objectStore(storeName);

                    const storeGetAll = store.getAll();
                    var promiseStore = new Promise(function(resolve, reject) {
                      storeGetAll.onsuccess = function(event) {
                          resolve(event.target.result);
                      };
                      storeGetAll.onerror = function(event) {
                          reject(storeGetAll.error);
                      };
                    });

                    tx.onerror = function() {
                        reject(err);
                    };

                    tx.oncomplete = function() {
                        db.close();
                        promiseStore.then(function(result) {
                          console.log("Content in indexedDB store: " + JSON.stringify(result));
                          resolve(result);
                        }, function(err) {
                          console.log("Error in indexedDB store: " + err);
                          reject(err);
                        });
                    };
                }
              } else {
                console.log('Cannot use indexDB for url: ' + url);
                reject();
              }
            });
          }

          return response
            || promiseIndexedDB(event.request.url).then(function(result) {
                console.log('Could not find in cache: ' + event.request.url);
                var blob = new Blob([JSON.stringify(result)], {type : 'application/json'});
                var response = new Response(blob);
                console.log('Returning data for ' + event.request.url + ' from indexedDB: ' + response);
                return response;
              }, function(err) {
                console.log('File need to be fetched from url: ' + event.request.url);
                return fetch(event.request).then(function(response) {
                    console.log('Returning data ' + event.request.url + ' from server after failed indexedDB: ' + response);

                    if (event.request.url.includes("https://maps.googleapis.com/maps/api/js")
                          || event.request.url.includes("https://maps.googleapis.com/maps-api-v3")
                          || event.request.url.includes("https://fonts.googleapis.com")
                          || event.request.url.includes("https://fonts.gstatic.com")
                          || event.request.url.includes("https://maps.gstatic.com")) {
                      console.log('Caching data from Google for url: ' + event.request.url);
                    }
                    return response;
                });
              })
            || fetch(event.request).then(function(response) {
                console.log('Returning data for ' + event.request.url + ' from origin: ' + response);
                return response;
            });
        }, function(err) {
          console.log('There is a problem with cache for url: ' + event.request.url);
          return fetch(event.request).then(function(response) {
            console.log('Returning data ' + event.request.url + ' from server after failed cache: ' + response);
            return response;
          });
        })
      );
  });
})();
