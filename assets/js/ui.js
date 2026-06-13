(function () {
  "use strict";
  var UP = window.UP;
  var el = UP.el, on = UP.on, $ = UP.$;

  var PATHS = {
    home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    user: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    plus: "M12 5v14M5 12h14",
    dice: "M4 4h16v16H4zM9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01",
    flag: "M4 21V4M4 4h13l-2 4 2 4H4",
    compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16 8l-2 6-6 2 2-6z",
    moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    back: "M19 12H5M12 19l-7-7 7-7",
    close: "M18 6 6 18M6 6l12 12",
    chevron: "M9 18l6-6-6-6",
    doc: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6",
    image: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
    video: "M3 5h13v14H3zM16 9l5-3v12l-5-3",
    link: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
    news: "M4 5h13v14H4zM17 8h3v9a2 2 0 0 1-2 2M8 9h5M8 13h5",
    pin: "M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    scale: "M12 3v18M5 21h14M12 6 5 9l3 5a3 3 0 0 1-6 0zM12 6l7 3-3 5a3 3 0 0 0 6 0z",
    bolt: "M13 2 4 14h6l-1 8 9-12h-6z"
  };
  function icon(name, cls) {
    var p = PATHS[name] || PATHS.compass;
    return el("svg", { "class": "icon " + (cls || ""), viewBox: "0 0 24 24", "aria-hidden": "true" }, [
      el("path", { d: p })
    ]);
  }
  UP.icon = icon;

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", { "class": "toast", role: "status", "aria-live": "polite" }); document.body.appendChild(toastEl); }
    toastEl.textContent = UP.str(msg);
    toastEl.classList.add("is-show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("is-show"); }, 2400);
  }
  UP.toast = toast;

  var NAV = [
    { id: "home", label: "Home", icon: "home", href: "index.html" },
    { id: "categories", label: "Categories", icon: "grid", href: "categories.html" },
    { id: "search", label: "Search", icon: "search", href: "#search" },
    { id: "cases", label: "Cases", icon: "list", href: "search.html?view=cases" },
    { id: "profile", label: "Profile", icon: "user", href: "profile.html" }
  ];
  function currentPage() { return (document.body.getAttribute("data-page") || "home"); }

  function buildAppBar() {
    var page = currentPage();
    var nav = el("nav", { "class": "appbar__nav", "aria-label": "Primary" },
      NAV.filter(function (n) { return n.id !== "search"; }).map(function (n) {
        return el("a", { href: n.href, "class": n.id === page ? "is-active" : "", "aria-current": n.id === page ? "page" : null, text: n.label });
      })
    );
    var bar = el("header", { "class": "appbar" }, [
      el("a", { href: "index.html", "class": "appbar__brand", "aria-label": "Avow home" }, [
        el("img", { "class": "appbar__logo", src: "assets/icons/icon.svg", alt: "", width: "28", height: "28" }), el("span", { text: "Avow" })
      ]),
      nav,
      el("span", { "class": "appbar__spacer" }),
      el("button", { "class": "iconbtn", "aria-label": "Open search", on: { click: openSearch } }, icon("search")),
      el("button", { "class": "iconbtn", "aria-label": "Toggle theme", on: { click: function () { UP.toggleTheme(); } } }, icon("moon"))
    ]);
    return bar;
  }

  function buildSidebar() {
    var page = currentPage();
    var items = NAV.map(function (n) {
      var isSearch = n.id === "search";
      return el("a", {
        href: isSearch ? "#search" : n.href,
        "class": "sidebar__item " + (n.id === page ? "is-active" : ""),
        on: isSearch ? { click: function (e) { e.preventDefault(); openSearch(); } } : null
      }, [icon(n.icon), el("span", { text: n.label })]);
    });
    var footer = el("div", { "class": "sidebar__footer" }, [
      el("img", { "class": "sidebar__poweredlogo", src: "assets/icons/openaql.svg", alt: "OpenAQL", width: "30", height: "30" }),
      el("span", { "class": "sidebar__poweredtext", text: "Powered by OpenAQL" })
    ]);
    return el("aside", { "class": "sidebar", "aria-label": "Sidebar" }, items.concat([footer]));
  }

  function buildBottomNav() {
    var page = currentPage();
    return el("nav", { "class": "bottomnav", "aria-label": "Bottom navigation" },
      NAV.map(function (n) {
        var isSearch = n.id === "search";
        return el("a", {
          href: isSearch ? "#search" : n.href,
          "class": "bottomnav__item " + (n.id === page ? "is-active" : ""),
          "aria-label": n.label,
          "aria-current": n.id === page ? "page" : null,
          on: isSearch ? { click: function (e) { e.preventDefault(); openSearch(); } } : null
        }, [icon(n.icon), el("span", { text: n.label })]);
      })
    );
  }

  function buildFab() {
    var actions = [
      { label: "Search", icon: "search", on: openSearch },
      { label: "Random case", icon: "dice", on: randomCase },
      { label: "Browse categories", icon: "grid", on: function () { if (window._fabClose) window._fabClose(); location.href = "categories.html"; } }
    ];
    var wrap = el("div", { "class": "fab-wrap" });
    var scrim = el("div", { "class": "fab-scrim", "aria-hidden": "true" });
    var fabBtn = el("button", { "class": "fab", "aria-label": "Quick actions", "aria-expanded": "false" }, icon("plus"));
    var actEls = el("div", { "class": "fab-actions" }, actions.map(function (a) {
      return el("div", { "class": "fab-action" }, [
        el("span", { "class": "fab-action__label", text: a.label }),
        el("button", { "class": "fab-action__btn", "aria-label": a.label, on: { click: a.on } }, icon(a.icon))
      ]);
    }));
    function toggle() { wrap.classList.contains("is-open") ? close() : open(); }
    function open() { wrap.classList.add("is-open"); scrim.classList.add("is-open"); fabBtn.setAttribute("aria-expanded", "true"); }
    function close() { wrap.classList.remove("is-open"); scrim.classList.remove("is-open"); fabBtn.setAttribute("aria-expanded", "false"); }
    on(fabBtn, "click", toggle); on(scrim, "click", close);
    wrap.appendChild(actEls); wrap.appendChild(fabBtn);
    document.body.appendChild(scrim);
    window._fabClose = close;
    return wrap;
  }
  function randomCase() {
    if (window._fabClose) window._fabClose();
    UP.loadAllCases().then(function (all) {
      if (!all.length) return;
      var c = all[Math.floor(Math.random() * all.length)];
      location.href = "case.html?id=" + encodeURIComponent(c.id);
    });
  }

  var overlay, searchInput, resultsBox;
  function buildSearchOverlay() {
    searchInput = el("input", { "class": "search-input", type: "text", placeholder: "Search cases, people, locations\u2026", "aria-label": "Search" });
    resultsBox = el("div", { "class": "search-results" });
    overlay = el("div", { "class": "search-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Search" }, [
      el("div", { "class": "search-bar" }, [
        el("button", { "class": "iconbtn", "aria-label": "Close search", on: { click: closeSearch } }, icon("back")),
        searchInput
      ]),
      resultsBox
    ]);
    var run = UP.debounce(function () { renderSearch(searchInput.value); }, 120);
    on(searchInput, "input", run);
    on(document, "keydown", function (e) { if (e.key === "Escape") closeSearch(); });
    document.body.appendChild(overlay);
    renderSearch("");
  }
  function openSearch() { if (window._fabClose) window._fabClose(); overlay.classList.add("is-open"); setTimeout(function () { searchInput.focus(); }, 60); }
  function closeSearch() { overlay.classList.remove("is-open"); }
  UP.openSearch = openSearch;

  function renderSearch(q) {
    UP.loadAllCases().then(function (all) {
      var list = UP.searchCases(all, q).slice(0, 40);
      if (!list.length) {
        UP.mount(resultsBox, el("div", { "class": "search-empty" }, [
          icon("search", "state__icon"), el("p", { text: q ? "No matches for \u201c" + UP.str(q) + "\u201d" : "Start typing to search" })
        ]));
        return;
      }
      UP.mount(resultsBox, list.map(function (c) {
        return el("a", { href: "case.html?id=" + encodeURIComponent(c.id), "class": "result-row" }, [
          UP.components.avatar(c.name, 44, c.photo || c.cover),
          el("div", { style: { flex: "1" } }, [
            el("div", { "class": "result-row__name", text: c.name }),
            el("div", { "class": "result-row__meta", text: c.caseType + " \u00b7 " + (c.location || "\u2014") })
          ]),
          el("span", { "class": "badge badge--status status-" + c.status, text: UP.STATUS_LABEL[c.status] || c.status })
        ]);
      }));
    });
  }

  var qvOverlay, qvCard;
  function buildQuickView() {
    qvCard = el("div", { "class": "qv-card", role: "document" });
    qvOverlay = el("div", { "class": "qv-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Case preview" }, [qvCard]);
    on(qvOverlay, "click", function (e) { if (e.target === qvOverlay) closeQuickView(); });
    on(document, "keydown", function (e) { if (e.key === "Escape") closeQuickView(); });
    document.body.appendChild(qvOverlay);
  }
  function openQuickView(id) {
    if (window._fabClose) window._fabClose();
    if (!qvOverlay) buildQuickView();
    UP.caseById(id).then(function (c) {
      if (!c) { toast("Case not found"); return; }
      renderQuickView(c);
      qvOverlay.classList.add("is-open");
    });
  }
  function closeQuickView() { if (qvOverlay) qvOverlay.classList.remove("is-open"); }
  UP.openQuickView = openQuickView;

  function renderQuickView(c) {
    var C = UP.components;
    var caseHref = "case.html?id=" + encodeURIComponent(c.id);
    var info = el("dl", { "class": "qv-info" });
    function addRow(label, value) { info.appendChild(el("dt", { text: label })); info.appendChild(el("dd", { text: value })); }
    addRow("Crime type", c.caseType || "\u2014");
    if (c.age) addRow("Age", String(c.age));
    addRow("Status", UP.STATUS_LABEL[c.status] || c.status);
    addRow("Location", c.location || "\u2014");
    addRow("Date reported", UP.fmtDate(c.date) || "\u2014");
    var actions = el("div", { "class": "qv-actions" }, [
      el("a", { href: caseHref, "class": "btn btn--primary btn--block" }, [icon("doc", "icon--sm"), el("span", { text: "Open full case" })]),
      c.personId ? el("a", { href: "profile.html?id=" + encodeURIComponent(c.personId), "class": "btn btn--ghost btn--block" }, [icon("user", "icon--sm"), el("span", { text: "View full profile" })]) : null
    ]);
    UP.mount(qvCard, [
      el("button", { "class": "iconbtn qv-close", "aria-label": "Close preview", on: { click: closeQuickView } }, icon("close")),
      C.media(c, { cls: "qv-media" }),
      el("div", { "class": "qv-body" }, [
        el("h2", { "class": "qv-name", text: c.name }),
        info,
        c.shortDescription ? el("p", { "class": "qv-desc", text: c.shortDescription }) : null,
        actions
      ])
    ]);
  }

  function initReveal() {
    function revealAll() { var ns = document.querySelectorAll(".reveal"); for (var i = 0; i < ns.length; i++) ns[i].classList.add("is-in"); }
    if (!("IntersectionObserver" in window)) {
      revealAll();
      try { new MutationObserver(revealAll).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
      UP.observeReveal = function (node) { if (node && node.classList) node.classList.add("is-in"); };
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" });
    function observe(n) { if (n && n.classList && n.classList.contains("reveal") && !n.classList.contains("is-in")) io.observe(n); }
    function observeTree(scope) {
      observe(scope);
      if (scope && scope.querySelectorAll) { var ns = scope.querySelectorAll(".reveal"); for (var i = 0; i < ns.length; i++) observe(ns[i]); }
    }
    UP.observeReveal = function (node) { observeTree(node); };
    observeTree(document.body);
    try {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes; if (!added) continue;
          for (var j = 0; j < added.length; j++) { if (added[j].nodeType === 1) observeTree(added[j]); }
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    setTimeout(revealAll, 1600);
  }

  var deferredPrompt = null;
  function initPWA() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("pwa/service-worker.js").catch(function () {  });
      });
    }
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault(); deferredPrompt = e; showInstallBanner();
    });
    window.addEventListener("appinstalled", function () { toast("Avow installed"); hideInstallBanner(); });
  }
  var banner;
  function showInstallBanner() {
    try { if (localStorage.getItem("up-install-dismissed") === "1") return; } catch (e) {}
    if (!banner) {
      banner = el("div", { "class": "install-banner", role: "dialog", "aria-label": "Install app" }, [
        el("img", { "class": "appbar__logo", src: "assets/icons/icon.svg", alt: "", style: { width: "40px", height: "40px" } }),
        el("div", { style: { flex: "1" } }, [
          el("div", { style: { "font-weight": "750" }, text: "Install Avow" }),
          el("div", { "class": "mut", style: { "font-size": "12.5px" }, text: "Add to your home screen for the full app experience." })
        ]),
        el("button", { "class": "btn btn--ghost btn--sm", text: "Later", on: { click: function () { try { localStorage.setItem("up-install-dismissed", "1"); } catch (e) {} hideInstallBanner(); } } }),
        el("button", { "class": "btn btn--primary btn--sm", text: "Install", on: { click: doInstall } })
      ]);
      document.body.appendChild(banner);
    }
    banner.classList.add("is-show");
  }
  function hideInstallBanner() { if (banner) banner.classList.remove("is-show"); }
  function doInstall() {
    if (!deferredPrompt) { toast("Use your browser menu \u2192 Add to Home Screen"); return; }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(function () { deferredPrompt = null; hideInstallBanner(); });
  }

  function hideSplash() { var s = $("#splash"); if (s) { s.classList.add("is-hide"); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 420); } }

  function boot() {
    document.body.insertBefore(buildAppBar(), document.body.firstChild);
    document.body.appendChild(buildSidebar());
    document.body.appendChild(buildBottomNav());
    document.body.appendChild(buildFab());
    buildSearchOverlay();
    buildQuickView();
    initReveal();
    initPWA();
    if (location.hash === "#search") openSearch();
    window.addEventListener("load", function () { setTimeout(hideSplash, 350); });
    setTimeout(hideSplash, 2500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();