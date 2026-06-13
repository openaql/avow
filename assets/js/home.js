(function () {
  "use strict";
  var UP = window.UP, el = UP.el, icon = UP.icon;
  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }

  ready(function () {
    var C = UP.components;
    Promise.all([UP.loadIndex(), UP.loadAllCases()]).then(function (res) {
      var idx = res[0], all = res[1];
      var colors = {}; idx.categories.forEach(function (c) { colors[c.id] = c.color; });
      C.setCategoryColors(colors);
      renderRails(all);
      renderCategoryChips(idx, all);
    }).catch(function (e) { showError(e); });
  });

  function countEvidence(all) { return all.reduce(function (n, c) { return n + c.evidence.length; }, 0); }

  function renderStats(idx, all) {
    var box = UP.$("#stats"); if (!box) return;
    var arrested = all.filter(function (c) { return ["arrested", "on_trial", "convicted", "released"].indexOf(c.status) !== -1; }).length;
    var convicted = all.filter(function (c) { return c.status === "convicted"; }).length;
    var stats = [
      { label: "Total Cases", value: all.length, icon: "list", color: "#1CC2BB" },
      { label: "Arrested", value: arrested, icon: "flag", color: "#f59e0b" },
      { label: "Convicted", value: convicted, icon: "scale", color: "#ef4444" },
      { label: "Categories", value: idx.categories.length, icon: "grid", color: "#8b5cf6" },
      { label: "Evidence", value: countEvidence(all), icon: "doc", color: "#10b981" }
    ];
    UP.mount(box, stats.map(function (s) {
      return el("div", { "class": "stat reveal" }, [
        el("div", { "class": "stat__icon", style: { background: "linear-gradient(135deg," + s.color + "," + UP.shade(s.color, -22) + ")" } }, icon(s.icon, "icon--sm")),
        el("div", { "class": "stat__value tabnum", text: "0", dataset: { count: String(s.value) } }),
        el("div", { "class": "stat__label", text: s.label })
      ]);
    }));
    animateCounts();
  }

  function animateCounts() {
    UP.$all(".stat__value").forEach(function (node) {
      var target = UP.num(node.dataset.count), start = 0, t0 = performance.now(), dur = 900;
      function tick(t) { var p = Math.min(1, (t - t0) / dur); var e = 1 - Math.pow(1 - p, 3); node.textContent = String(Math.round(start + (target - start) * e)); if (p < 1) requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    });
  }

  function rail(id, list) {
    var box = UP.$(id); if (!box) return;
    if (!list.length) { UP.mount(box, UP.components.emptyState("Nothing here yet", "", "list")); return; }
    UP.mount(box, list.map(function (c) { return UP.components.caseCard(c); }));
    if (UP.observeReveal) UP.$all(".reveal", box).forEach(UP.observeReveal);
  }

  function renderRails(all) {
    var byDate = all.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    rail("#recent", byDate.slice(0, 3));
    rail("#trending", all.filter(function (c) { return c.trending; }).slice(0, 3));
    rail("#featured", all.filter(function (c) { return c.featured; }).slice(0, 3));
  }

  function renderCategoryChips(idx, all) {
    var box = UP.$("#cat-chips"); if (!box) return;
    UP.mount(box, idx.categories.slice(0, 6).map(function (cat) {
      var count = all.filter(function (c) { return c.category === cat.id; }).length;
      return el("a", { href: "categories.html?cat=" + encodeURIComponent(cat.id), "class": "cat-chip" }, [
        el("span", { "class": "dot", style: { background: cat.color } }),
        el("span", { text: cat.label }),
        el("span", { "class": "mut", text: String(count) })
      ]);
    }));
  }

  function showError(e) {
    var box = UP.$("#recent");
    if (box) UP.mount(box, UP.components.emptyState("Couldn\u2019t load data", "Check that the data/ JSON files are present.", "close"));
  }
})();