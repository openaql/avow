"use strict";

var CACHE_VERSION = "avow-v0.1.0";
var SHELL_CACHE = CACHE_VERSION + "-shell";
var DATA_CACHE = CACHE_VERSION + "-data";

var SHELL_ASSETS = [
  "../index.html",
  "../categories.html",
  "../search.html",
  "../profile.html",
  "../case.html",
  "../offline.html",
  "../assets/css/styles.css",
  "../assets/js/core.js",
  "../assets/js/ui.js",
  "../assets/js/components.js",
  "../assets/js/home.js",
  "../assets/js/categories.js",
  "../assets/js/search.js",
  "../assets/js/profile.js",
  "../assets/js/case.js",
  "../assets/icons/icon.svg",
  "../assets/icons/icon-192.png",
  "../assets/icons/icon-512.png",
  "../assets/icons/openaql.svg",
  "../pwa/manifest.json"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return Promise.all(SHELL_ASSETS.map(function (url) {
        return fetch(url, { cache: "reload" }).then(function (r) { if (r.ok) return cache.put(url, r); }).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf(CACHE_VERSION) !== 0) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isData(url) { return /\/data\/.*\.json($|\?)/.test(url); }
function isNavigation(req) { return req.mode === "navigate" || (req.method === "GET" && req.headers.get("accept") && req.headers.get("accept").indexOf("text/html") !== -1); }

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isData(url.pathname)) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(DATA_CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        return caches.open(DATA_CACHE).then(function (cache) { return cache.match(req); });
      })
    );
    return;
  }

  if (isNavigation(req)) {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) { return cached || caches.match("../offline.html"); });
      })
    );
    return;
  }

  if (/\.(js|css|svg|png|jpe?g|webp|gif|ico)($|\?)/.test(url.pathname)) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});