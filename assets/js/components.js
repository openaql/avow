(function () {
  "use strict";
  var UP = window.UP, el = UP.el, icon = UP.icon;
  var CAT_COLORS = {};

  function setCategoryColors(map) { CAT_COLORS = map || {}; }
  function catColor(id) { return CAT_COLORS[id] || "#1CC2BB"; }

  function signalRing(score) {
    return el("span", { "class": "signal", style: { "--score": String(score), color: scoreColor(score) }, "aria-label": "Signal score " + score }, [
      el("span", { text: String(score) })
    ]);
  }
  function scoreColor(s) { return s >= 80 ? "#ef4444" : s >= 60 ? "#f59e0b" : s >= 40 ? "#3b82f6" : "#10b981"; }

  function statusBadge(status) {
    return el("span", { "class": "badge badge--status status-" + status, text: UP.STATUS_LABEL[status] || status });
  }

  function avatar(name, size, photo, color) {
    var g = UP.gradientFor(name, color);
    var s = (size || 48) + "px";
    if (photo) {
      return el("img", { "class": "avatar", src: photo, alt: "", width: size || 48, height: size || 48, loading: "lazy", decoding: "async", style: { width: s, height: s, "object-fit": "cover" } });
    }
    return el("span", { "class": "avatar gradient-media", style: { width: s, height: s, "--c1": g.c1, "--c2": g.c2, "font-size": (size ? size / 2.6 : 18) + "px" }, "aria-hidden": "true", text: UP.initials(name) });
  }

  function media(c, opts) {
    opts = opts || {};
    var g = UP.gradientFor(c.name, catColor(c.category));
    var children = [];
    if (!opts.noBadges) {
      children.push(el("span", { "class": "case-card__badge" }, statusBadge(c.status)));
      children.push(el("span", { "class": "case-card__signal" }, signalRing(c.signalScore)));
    }

    var img = c.photo || c.cover;
    if (img) {
      return el("div", { "class": (opts.cls || "case-card__media") }, [
        el("img", { src: img, alt: "", loading: "lazy", decoding: "async", style: { position: "absolute", inset: "0", width: "100%", height: "100%", "object-fit": "cover" } })
      ].concat(children));
    }
    return el("div", { "class": (opts.cls || "case-card__media") + " gradient-media", style: { "--c1": g.c1, "--c2": g.c2 } },
      [el("span", { "aria-hidden": "true", text: UP.initials(c.name) })].concat(children));
  }

  function caseCard(c) {
    return el("article", { "class": "case-card reveal" }, [
      el("a", { href: "case.html?id=" + encodeURIComponent(c.id), "aria-label": c.name }, media(c)),
      el("div", { "class": "case-card__body" }, [
        el("a", { href: "case.html?id=" + encodeURIComponent(c.id), "class": "case-card__name", text: c.name }),
        el("div", { "class": "case-card__meta" }, [
          el("span", { text: c.caseType }),
          el("span", { text: "\u00b7" }),
          el("span", { "class": "row" }, [icon("pin", "icon--sm"), el("span", { text: c.location || "\u2014" })])
        ]),
        el("p", { "class": "case-card__desc", text: c.shortDescription }),
        el("div", { "class": "case-card__foot" }, [
          el("span", { "class": "case-card__meta" }, [icon("news", "icon--sm"), el("span", { text: UP.fmtDate(c.date) })]),
          el("button", { "class": "btn btn--ghost btn--sm quick-view", type: "button", "aria-label": "Quick view " + c.name, on: { click: function (e) { e.preventDefault(); e.stopPropagation(); if (UP.openQuickView) UP.openQuickView(c.id); else location.href = "case.html?id=" + encodeURIComponent(c.id); } } }, [el("span", { text: "Quick view" }), icon("chevron", "icon--sm")])
        ])
      ])
    ]);
  }

  function skeletonCards(n, railCls) {
    var items = [];
    for (var i = 0; i < (n || 4); i++) items.push(el("div", { "class": "case-card" }, [
      el("div", { "class": "skeleton sk-card" })
    ]));
    return items;
  }

  function emptyState(title, sub, iconName) {
    return el("div", { "class": "state" }, [
      icon(iconName || "search", "state__icon"),
      el("p", { "class": "state__title", text: title }),
      sub ? el("p", { text: sub }) : null
    ]);
  }

  UP.components = {
    setCategoryColors: setCategoryColors, catColor: catColor, signalRing: signalRing, scoreColor: scoreColor,
    statusBadge: statusBadge, avatar: avatar, media: media, caseCard: caseCard, skeletonCards: skeletonCards, emptyState: emptyState
  };
})();