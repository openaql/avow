(function () {
  "use strict";

  var SAFE_ATTRS = {
    "class": 1, "id": 1, "role": 1, "tabindex": 1, "type": 1, "value": 1,
    "placeholder": 1, "alt": 1, "title": 1, "width": 1, "height": 1,
    "loading": 1, "decoding": 1, "aria-label": 1, "aria-hidden": 1,
    "aria-expanded": 1, "aria-live": 1, "aria-current": 1, "datetime": 1,
    "for": 1, "name": 1, "min": 1, "max": 1, "step": 1, "checked": 1,
    "viewBox": 1, "fill": 1, "stroke": 1, "d": 1, "points": 1, "cx": 1,
    "cy": 1, "r": 1, "x": 1, "y": 1, "x1": 1, "y1": 1, "x2": 1, "y2": 1,
    "rx": 1, "ry": 1, "transform": 1, "stroke-width": 1, "stroke-linecap": 1,
    "stroke-linejoin": 1, "offset": 1, "gradientUnits": 1, "stop-color": 1
  };
  var SVG_NS = "http://www.w3.org/2000/svg";
  var SVG_TAGS = { svg:1, path:1, circle:1, rect:1, line:1, polyline:1, polygon:1, g:1, use:1, defs:1, linearGradient:1, stop:1, text:1 };

  function el(tag, props, children) {
    var node = SVG_TAGS[tag]
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === "text") { node.textContent = String(v); return; }
        if (k === "html") { return; }
        if (k === "dataset") { Object.keys(v).forEach(function (d) { node.dataset[d] = String(v[d]); }); return; }
        if (k === "style") { 
          Object.keys(v).forEach(function (sp) { try { node.style.setProperty(sp, String(v[sp])); } catch (e) {} });
          return;
        }
        if (k === "on" && typeof v === "object") { 
          Object.keys(v).forEach(function (evt) { node.addEventListener(evt, v[evt]); });
          return;
        }
        if (k === "href") { var u = safeUrl(v); if (u) { node.setAttribute("href", u); node.setAttribute("rel", "noopener noreferrer"); } return; }
        if (k === "src") { var su = safeUrl(v); if (su) node.setAttribute("src", su); return; }
        if (SAFE_ATTRS[k] || k.indexOf("data-") === 0 || k.indexOf("aria-") === 0) {
          node.setAttribute(k, String(v));
        }
      });
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === "string" || typeof c === "number") {
        node.appendChild(document.createTextNode(String(c)));
      } else if (c instanceof Node) {
        node.appendChild(c);
      }
    });
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function mount(node, children) { clear(node); appendChildren(node, children); return node; }
  function text(s) { return document.createTextNode(s == null ? "" : String(s)); }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function safeUrl(raw) {
    if (!raw) return "";
    var s = String(raw).trim();
    if (s === "") return "";
    if (s.slice(0, 2) === "//") return "";
    if (!/^[a-z][a-z0-9+.\-]*:/i.test(s)) return s;
    try {
      var u = new URL(s, location.href);
      if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") {
        return u.href;
      }
    } catch (e) {  }
    return "";
  }

  function str(v, max) {
    if (v == null) return "";
    var s = typeof v === "string" ? v : String(v);
    s = s.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (max && s.length > max) s = s.slice(0, max) + "\u2026";
    return s;
  }
  function num(v, def) { var n = Number(v); return isFinite(n) ? n : (def || 0); }
  function arr(v) { return Array.isArray(v) ? v : []; }

  var cache = {};
  function getJSON(url) {
    if (cache[url]) return cache[url];
    var p = fetch(url, { credentials: "omit", cache: "default" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status + " for " + url); return r.json(); })
      .catch(function (e) { delete cache[url]; throw e; });
    cache[url] = p;
    return p;
  }

  var _index = null, _allCases = null, _profiles = null;

  function loadIndex() {
    if (_index) return _index;
    _index = getJSON("data/index.json").then(function (idx) {
      idx.categories = arr(idx.categories);
      return idx;
    });
    return _index;
  }

  function normalizeCase(raw, catId) {
    return {
      id: str(raw.id),
      name: str(raw.name, 120),
      personId: str(raw.personId),
      category: str(raw.category || catId),
      caseType: str(raw.caseType, 80),
      age: (raw.age != null && isFinite(Number(raw.age))) ? Math.max(0, Math.min(130, num(raw.age))) : null,
      status: str(raw.status) || "suspect",
      date: str(raw.date, 20),
      signalScore: Math.max(0, Math.min(100, num(raw.signalScore))),
      location: str(raw.location, 120),
      source: safeUrl(raw.source),
      photo: safeUrl(raw.photo),
      cover: safeUrl(raw.cover),
      featured: !!raw.featured,
      trending: !!raw.trending,
      shortDescription: str(raw.shortDescription, 240),
      description: str(raw.description, 4000),
      laws: arr(raw.laws).map(function (x) { return str(x, 160); }),
      sections: arr(raw.sections).map(function (x) { return str(x, 160); }),
      charges: arr(raw.charges).map(function (x) { return str(x, 160); }),
      timeline: arr(raw.timeline).map(function (t) {
        return { stage: str(t.stage), date: str(t.date, 20), title: str(t.title, 120), detail: str(t.detail, 400) };
      }),
      evidence: arr(raw.evidence).map(function (e) {
        return { type: str(e.type) || "link", title: str(e.title, 160), url: safeUrl(e.url), thumb: safeUrl(e.thumb) };
      }),
      related: arr(raw.related).map(function (x) { return str(x); })
    };
  }

  function loadAllCases() {
    if (_allCases) return _allCases;
    _allCases = loadIndex().then(function (idx) {
      var files = idx.categories.filter(function (c) { return c.file; });
      return Promise.all(files.map(function (c) {
        return getJSON(c.file).then(function (d) { return arr(d.cases).map(function (x) { return normalizeCase(x, c.id); }); })
          .catch(function () { return []; });
      })).then(function (lists) {
        var all = [];
        lists.forEach(function (l) { all = all.concat(l); });
        return all;
      });
    });
    return _allCases;
  }

  function loadProfiles() {
    if (_profiles) return _profiles;
    _profiles = loadIndex().then(function (idx) {
      return getJSON(idx.profilesFile || "data/profiles.json").then(function (d) {
        return arr(d.profiles).map(function (p) {
          return { id: str(p.id), name: str(p.name, 120), age: (p.age != null && isFinite(Number(p.age))) ? Math.max(0, Math.min(130, num(p.age))) : null, location: str(p.location, 120), district: str(p.district, 80), avatar: safeUrl(p.avatar), riskScore: Math.max(0, Math.min(100, num(p.riskScore))), caseIds: arr(p.caseIds).map(function (x) { return str(x); }) };
        });
      }).catch(function () { return []; });
    });
    return _profiles;
  }

  function caseById(id) { return loadAllCases().then(function (all) { return all.find(function (c) { return c.id === id; }) || null; }); }
  function casesByCategory(cat) { return loadAllCases().then(function (all) { return all.filter(function (c) { return c.category === cat; }); }); }
  function profileById(id) { return loadProfiles().then(function (ps) { return ps.find(function (p) { return p.id === id; }) || null; }); }

  var STATUS_LABEL = { suspect: "Suspect", arrested: "Arrested", on_trial: "On Trial", convicted: "Convicted", released: "Released", active: "Active" };
  var TIMELINE_ORDER = ["suspect_identified", "evidence_collected", "arrested", "court_proceedings", "convicted", "released"];
  var STAGE_LABEL = { suspect_identified: "Suspect Identified", evidence_collected: "Evidence Collected", arrested: "Arrested", court_proceedings: "Court Proceedings", convicted: "Convicted", released: "Released" };

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return str(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function yearOf(iso) { var d = new Date(iso); return isNaN(d) ? "" : String(d.getFullYear()); }

  function gradientFor(seed, baseColor) {
    var h = 0; seed = String(seed || ""); for (var i = 0; i < seed.length; i++) { h = (h * 31 + seed.charCodeAt(i)) % 360; }
    var c1 = baseColor || ("hsl(" + h + ", 70%, 55%)");
    var c2 = baseColor ? shade(baseColor, -22) : ("hsl(" + ((h + 40) % 360) + ", 68%, 42%)");
    return { c1: c1, c2: c2 };
  }
  function shade(hex, pct) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
    var n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var f = (pct < 0 ? 0 : 255), p = Math.abs(pct) / 100;
    r = Math.round((f - r) * p) + r; g = Math.round((f - g) * p) + g; b = Math.round((f - b) * p) + b;
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function initials(name) {
    var parts = str(name).split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  function fuzzyScore(needle, hay) {
    needle = needle.toLowerCase(); hay = hay.toLowerCase();
    if (!needle) return 0;
    if (hay.indexOf(needle) !== -1) return 100 - hay.indexOf(needle);
    var n = 0, score = 0, streak = 0;
    for (var h = 0; h < hay.length && n < needle.length; h++) {
      if (hay[h] === needle[n]) { n++; streak++; score += streak; } else { streak = 0; }
    }
    return n === needle.length ? score : -1;
  }
  function searchCases(all, q) {
    q = str(q).trim();
    if (!q) return all.slice();
    return all.map(function (c) {
      var fields = [c.name, c.caseType, c.location, c.category, STATUS_LABEL[c.status] || c.status, c.shortDescription];
      var best = -1;
      fields.forEach(function (f) { var s = fuzzyScore(q, str(f)); if (s > best) best = s; });
      return { c: c, s: best };
    }).filter(function (x) { return x.s >= 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.c; });
  }

  function initTheme() {
    try {
      var t = localStorage.getItem("up-theme");
      if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    } catch (e) {}
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme");
    var isDark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("up-theme", next); } catch (e) {}
    return next;
  }

  function qs(name) { try { return new URLSearchParams(location.search).get(name) || ""; } catch (e) { return ""; } }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 200); }; }
  function on(node, evt, fn, opts) { if (node) node.addEventListener(evt, fn, opts); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  window.UP = {
    el: el, mount: mount, clear: clear, text: text, appendChildren: appendChildren,
    escapeHtml: escapeHtml, safeUrl: safeUrl, str: str, num: num, arr: arr,
    getJSON: getJSON, loadIndex: loadIndex, loadAllCases: loadAllCases, loadProfiles: loadProfiles,
    caseById: caseById, casesByCategory: casesByCategory, profileById: profileById,
    STATUS_LABEL: STATUS_LABEL, TIMELINE_ORDER: TIMELINE_ORDER, STAGE_LABEL: STAGE_LABEL,
    fmtDate: fmtDate, yearOf: yearOf, gradientFor: gradientFor, shade: shade, initials: initials,
    searchCases: searchCases, fuzzyScore: fuzzyScore,
    initTheme: initTheme, toggleTheme: toggleTheme,
    qs: qs, debounce: debounce, on: on, $: $, $all: $all
  };

  initTheme();
})();