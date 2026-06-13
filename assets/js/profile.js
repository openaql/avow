(function () {
  "use strict";
  var UP = window.UP, el = UP.el, icon = UP.icon;
  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }

  ready(function () {
    Promise.all([UP.loadIndex(), UP.loadAllCases(), UP.loadProfiles()]).then(function (res) {
      var idx = res[0], all = res[1], profiles = res[2];
      var colors = {}; idx.categories.forEach(function (c) { colors[c.id] = c.color; });
      UP.components.setCategoryColors(colors);
      var id = UP.qs("id");
      if (id) renderProfile(id, all, profiles);
      else renderDirectory(all, profiles);
    }).catch(function () {
      var root = UP.$("#profile-root"); if (root) UP.mount(root, UP.components.emptyState("Couldn\u2019t load profiles", "", "close"));
    });
  });

  function renderDirectory(all, profiles) {
    var root = UP.$("#profile-root"); if (!root) return;
    UP.mount(root, [
      el("h1", { "class": "page-title", text: "Profiles" }),
      el("p", { "class": "page-sub", text: profiles.length + " documented individuals" }),
      el("div", { "class": "case-list", style: { "margin-top": "8px" } }, profiles.map(function (p) {
        var cases = all.filter(function (c) { return p.caseIds.indexOf(c.id) !== -1; });
        return el("a", { href: "profile.html?id=" + encodeURIComponent(p.id), "class": "case-card reveal", style: { padding: "16px" } }, [
          el("div", { "class": "row", style: { gap: "12px" } }, [
            UP.components.avatar(p.name, 56, p.avatar),
            el("div", { style: { flex: "1" } }, [
              el("div", { "class": "case-card__name", text: p.name }),
              el("div", { "class": "mut", style: { "font-size": "13px" } }, [icon("pin", "icon--sm"), UP.text(" " + (p.location || "Unknown"))]),
              el("div", { "class": "mut", style: { "font-size": "12.5px", "margin-top": "4px" }, text: cases.length + (cases.length === 1 ? " case" : " cases") + " \u00b7 Risk " + p.riskScore })
            ])
          ])
        ]);
      }))
    ]);
    if (UP.observeReveal) UP.$all(".reveal", root).forEach(UP.observeReveal);
  }

  function renderProfile(id, all, profiles) {
    var root = UP.$("#profile-root"); if (!root) return;
    var p = profiles.find(function (x) { return x.id === id; });
    if (!p) { UP.mount(root, UP.components.emptyState("Profile not found", "", "user")); return; }
    var cases = all.filter(function (c) { return p.caseIds.indexOf(c.id) !== -1 || c.personId === p.id; });
    var arrests = cases.filter(function (c) { return ["arrested", "on_trial", "convicted", "released"].indexOf(c.status) !== -1; }).length;
    var convictions = cases.filter(function (c) { return c.status === "convicted"; }).length;
    var active = cases.filter(function (c) { return ["suspect", "arrested", "on_trial", "active"].indexOf(c.status) !== -1; }).length;
    var closed = cases.filter(function (c) { return ["convicted", "released"].indexOf(c.status) !== -1; }).length;

    var events = [];
    cases.forEach(function (c) { c.timeline.forEach(function (t) { events.push({ date: t.date, title: (UP.STAGE_LABEL[t.stage] || t.title), detail: c.name + " \u2014 " + c.caseType, stage: t.stage }); }); });
    events.sort(function (a, b) { return (a.date || "").localeCompare(b.date || ""); });

    UP.mount(root, [
      el("button", { "class": "iconbtn", "aria-label": "Back", style: { margin: "8px 4px" }, on: { click: function () { history.length > 1 ? history.back() : (location.href = "profile.html"); } } }, icon("back")),
      el("section", { "class": "profile-head reveal" }, [
        UP.components.avatar(p.name, 92, p.avatar),
        el("h1", { "class": "profile-name", text: p.name }),
        el("div", { "class": "profile-loc row" }, [icon("pin", "icon--sm"), el("span", { text: p.location || "Unknown" })]),
        el("div", { "class": "row", style: { gap: "8px", "margin-top": "4px" } }, [
          el("span", { "class": "badge" }, [UP.text("Risk score "), el("strong", { text: " " + p.riskScore + "/100" })])
        ])
      ]),
      el("section", { "class": "profile-stats reveal" }, [
        pstat(arrests, "Arrests"), pstat(convictions, "Convictions"), pstat(active, "Active"), pstat(closed, "Closed")
      ]),
      el("section", { "class": "section" }, [
        el("div", { "class": "section__head" }, [el("h2", { "class": "section__title", text: "Crime History" })]),
        el("div", { "class": "case-list", style: { padding: "0" } }, cases.length ? cases.map(function (c) { return UP.components.caseCard(c); }) : [UP.components.emptyState("No cases", "", "list")])
      ]),
      events.length ? el("section", { "class": "section" }, [
        el("div", { "class": "section__head" }, [el("h2", { "class": "section__title", text: "Timeline History" })]),
        el("div", { "class": "panel" }, [
          el("div", { "class": "timeline" }, events.map(function (e) {
            return el("div", { "class": "tl-item is-done" }, [
              el("div", { "class": "tl-item__date", text: UP.fmtDate(e.date) }),
              el("div", { "class": "tl-item__title", text: e.title }),
              el("div", { "class": "tl-item__detail", text: e.detail })
            ]);
          }))
        ])
      ]) : null
    ]);
    if (UP.observeReveal) UP.$all(".reveal", root).forEach(UP.observeReveal);
    document.title = p.name + " | Avow";
  }

  function pstat(v, l) { return el("div", { "class": "pstat" }, [el("div", { "class": "pstat__v tabnum", text: String(v) }), el("div", { "class": "pstat__l", text: l })]); }
})();