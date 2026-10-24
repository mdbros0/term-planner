/* Term Planner service worker (improvement pass).
   Cache-first for the app shell (index.html, manifest, icon), so the planner opens offline once it has loaded online.
   Bump SHELL_VERSION whenever index.html changes; otherwise a returning visitor keeps the old copy. */
var SHELL_VERSION = "v3";
var CACHE = "term-planner-shell-" + SHELL_VERSION;
var SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function(event){
  event.waitUntil(caches.open(CACHE).then(function(cache){ return cache.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(event){
  event.waitUntil(caches.keys().then(function(names){
    return Promise.all(names.filter(function(n){ return n.indexOf("term-planner-shell-") === 0 && n !== CACHE; })
      .map(function(n){ return caches.delete(n); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;   // fonts and other hosts go to the network
  event.respondWith(caches.match(req).then(function(hit){
    if (hit) return hit;
    return fetch(req).catch(function(){
      // Offline page navigation with nothing cached for that exact URL: serve the cached app.
      if (req.mode === "navigate") return caches.match("./index.html");
      return Response.error();
    });
  }));
});
