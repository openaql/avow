(function () {
  "use strict";
  var UP = window.UP, el = UP.el, icon = UP.icon;
  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }

  ready(function () {
    Promise.all([UP.loadIndex(), UP.loadAllCases()]).then(function (res) {
      var idx = res[0], all = res[1];
      var colors = {}; idx.categories.forEach(function (c) { colors[c.id] = c.color; });
      UP.components.setCategoryColors(colors);
      var id = UP.qs("id");
      var c = all.find(function (x) { return x.id === id; });
      if (!c) { UP.mount(UP.$("#case-root"), UP.components.emptyState("Case not found", "", "close")); return; }
      render(c, all, idx);
    }).catch(function () {
      UP.mount(UP.$("#case-root"), UP.components.emptyState("Couldn\u2019t load case", "", "close"));
    });
  });

  function catOf(idx, id) { return idx.categories.find(function (c) { return c.id === id; }) || { label: id, color: "#1CC2BB" }; }

  function render(c, all, idx) {
    var root = UP.$("#case-root");
    var cat = catOf(idx, c.category);
    document.title = c.name + " | Avow";

    var g = UP.gradientFor(c.name, cat.color);
    var heroChildren = [
      el("button", { "class": "iconbtn hero__back", "aria-label": "Back", on: { click: function () { history.length > 1 ? history.back() : (location.href = "index.html"); } } }, icon("back")),
      el("div", { "class": "hero__row" }, [
        UP.components.statusBadge(c.status),
        el("span", { "class": "badge", style: { background: cat.color, color: "#fff", border: "none" }, text: cat.label }),
        el("span", { "class": "badge badge--glass" }, [icon("news", "icon--sm"), el("span", { text: UP.fmtDate(c.date) })])
      ]),
      el("div", { "class": "row", style: { gap: "12px" } }, [
        el("h1", { "class": "hero__title", text: c.name }),
        UP.components.signalRing(c.signalScore)
      ])
    ];
    var heroImg = c.photo || c.cover;
    var hero = heroImg
      ? el("section", { "class": "hero" }, [el("img", { src: heroImg, alt: "", style: { position: "absolute", inset: "0", width: "100%", height: "100%", "object-fit": "cover" }, loading: "eager", decoding: "async" })].concat(heroChildren))
      : el("section", { "class": "hero gradient-media", style: { "--c1": g.c1, "--c2": g.c2 } }, heroChildren);

    var basic = panel("Basic Information", [
      kv([
        ["Full name", c.name], ["Age", c.age ? String(c.age) : "\u2014"], ["Location", c.location || "\u2014"],
        ["Crime type", c.caseType], ["Current status", UP.STATUS_LABEL[c.status] || c.status],
        ["Date reported", UP.fmtDate(c.date) || "\u2014"]
      ]),
      c.source ? el("a", { href: c.source, "class": "btn btn--ghost btn--sm", style: { "margin-top": "12px" } }, [icon("link", "icon--sm"), el("span", { text: "View source" })]) : null
    ]);

    var legal = panel("Legal Information", [
      sub("Applicable laws"), taglist(c.laws),
      sub("Sections"), taglist(c.sections),
      sub("Charges"), taglist(c.charges)
    ]);

    var tl = c.timeline.slice().sort(function (a, b) {
      var oa = UP.TIMELINE_ORDER.indexOf(a.stage), ob = UP.TIMELINE_ORDER.indexOf(b.stage);
      if (oa !== ob) return oa - ob; return (a.date || "").localeCompare(b.date || "");
    });
    var timeline = panel("Timeline", [
      tl.length ? el("div", { "class": "timeline" }, tl.map(function (t) {
        return el("div", { "class": "tl-item is-done" }, [
          el("div", { "class": "tl-item__date", text: UP.fmtDate(t.date) }),
          el("div", { "class": "tl-item__title", text: UP.STAGE_LABEL[t.stage] || t.title }),
          t.detail ? el("div", { "class": "tl-item__detail", text: t.detail }) : null
        ]);
      })) : el("p", { "class": "mut", text: "No timeline available." })
    ]);

    var evidence = panel("Evidence", [
      c.evidence.length ? el("div", { "class": "gallery" }, c.evidence.map(evCard)) : el("p", { "class": "mut", text: "No evidence attached." })
    ]);

    var desc = panel("Detailed Description", [el("p", { "class": "prose", text: c.description || "No description provided." })]);

    var seen = {}; seen[c.id] = 1;
    var relatedCases = [];
    function addRelated(list) {
      list.forEach(function (x) { if (x && x.id && !seen[x.id]) { seen[x.id] = 1; relatedCases.push(x); } });
    }
    addRelated(c.related.map(function (rid) { return all.find(function (x) { return x.id === rid; }); }));

    addRelated(all.filter(function (x) { return x.caseType && c.caseType && x.caseType === c.caseType; }));

    addRelated(all.filter(function (x) { return x.category === c.category; }));
    relatedCases = relatedCases.slice(0, 6);
    var related = el("section", { "class": "section" }, [
      el("div", { "class": "section__head" }, [el("h2", { "class": "section__title", text: "Related Cases" })]),
      relatedCases.length
        ? el("div", { "class": "case-rail" }, relatedCases.map(function (rc) { return UP.components.caseCard(rc); }))
        : el("p", { "class": "mut", style: { padding: "0 4px 8px" }, text: "No related cases found." })
    ]);

    var profileBtn = c.personId ? el("a", { href: "profile.html?id=" + encodeURIComponent(c.personId), "class": "btn btn--primary btn--block", style: { "margin-top": "14px" } }, [icon("user", "icon--sm"), el("span", { text: "View full profile" })]) : null;

    UP.mount(root, [
      hero,
      el("div", { "class": "detail" }, [
        el("div", {}, [basic, legal, profileBtn]),
        el("div", {}, [timeline]),
        el("div", {}, [desc]),
        el("div", {}, [evidence])
      ]),
      related
    ]);
  }

  function panel(title, children) { return el("section", { "class": "panel reveal" }, [el("div", { "class": "panel__title", text: title })].concat(children.filter(Boolean))); }
  function sub(t) { return el("div", { "class": "mut", style: { "font-size": "12.5px", "font-weight": "700", margin: "10px 0 6px" }, text: t }); }
  function kv(pairs) { var dl = el("dl", { "class": "kv" }); pairs.forEach(function (p) { dl.appendChild(el("dt", { text: p[0] })); dl.appendChild(el("dd", { text: p[1] })); }); return dl; }
  function taglist(items) {
    if (!items.length) return el("p", { "class": "mut", style: { "font-size": "13px" }, text: "\u2014" });
    return el("div", { "class": "taglist" }, items.map(function (t) { return el("span", { "class": "badge", text: t }); }));
  }
  var EV_ICON = { image: "image", video: "video", document: "doc", link: "link", news: "news" };
  function evCard(e) {
    var thumb = e.type === "image" && e.url
      ? el("img", { src: e.url, alt: "", loading: "lazy", decoding: "async", style: { width: "100%", height: "100%", "object-fit": "cover" } })
      : icon(EV_ICON[e.type] || "link", "icon--lg");
    var inner = el("div", { "class": "ev-card" }, [
      el("div", { "class": "ev-card__thumb" }, thumb),
      el("div", { "class": "ev-card__cap" }, [
        el("div", { style: { flex: "1" } }, [el("div", { "class": "ev-type", text: e.type }), el("div", { text: e.title || "Evidence" })]),
        e.url ? icon("chevron", "icon--sm") : null
      ])
    ]);
    if (e.url) return el("a", { href: e.url, "aria-label": e.title || e.type }, inner);
    return inner;
  }
})();