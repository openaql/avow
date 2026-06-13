(function () {
  "use strict";
  var UP = window.UP, el = UP.el, icon = UP.icon;
  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }

  ready(function () {
    Promise.all([UP.loadIndex(), UP.loadAllCases()]).then(function (res) {
      var idx = res[0], all = res[1];
      var colors = {}; idx.categories.forEach(function (c) { colors[c.id] = c.color; });
      UP.components.setCategoryColors(colors);
      renderGrid(idx, all);
      var active = UP.qs("cat");
      if (active) showCategory(idx, all, active);
    }).catch(function () {
      var g = UP.$("#cat-grid"); if (g) UP.mount(g, UP.components.emptyState("Couldn\u2019t load categories", "", "close"));
    });
  });

  function renderGrid(idx, all) {
    var grid = UP.$("#cat-grid"); if (!grid) return;
    UP.mount(grid, idx.categories.map(function (cat) {
      var count = all.filter(function (c) { return c.category === cat.id; }).length;
      return el("a", { href: "categories.html?cat=" + encodeURIComponent(cat.id), "class": "cat-card reveal" }, [
        el("div", { "class": "cat-card__icon", style: { background: "linear-gradient(135deg," + cat.color + "," + UP.shade(cat.color, -24) + ")" } }, icon(mapIcon(cat.icon), "icon--sm")),
        el("div", { "class": "cat-card__name", text: cat.label }),
        el("div", { "class": "cat-card__count", text: count + (count === 1 ? " case" : " cases") })
      ]);
    }));
    if (UP.observeReveal) UP.$all(".reveal", grid).forEach(UP.observeReveal);
  }

  function mapIcon(name) {
    var m = { "shield-alert": "flag", skull: "user", phone: "news", gavel: "scale", "credit-card": "doc", cpu: "bolt", flame: "bolt", bank: "grid", users: "user" };
    return m[name] || "grid";
  }

  function showCategory(idx, all, catId) {
    var cat = idx.categories.find(function (c) { return c.id === catId; });
    var listBox = UP.$("#cat-list"); var head = UP.$("#cat-head");
    if (!cat || !listBox) return;
    var list = all.filter(function (c) { return c.category === catId; });
    if (head) UP.mount(head, [
      el("div", { "class": "row", style: { gap: "12px" } }, [
        el("div", { "class": "cat-card__icon", style: { background: "linear-gradient(135deg," + cat.color + "," + UP.shade(cat.color, -24) + ")" } }, icon(mapIcon(cat.icon))),
        el("div", {}, [ el("div", { "class": "page-title", style: { padding: "0" }, text: cat.label }), el("div", { "class": "mut", text: list.length + " documented cases" }) ])
      ])
    ]);
    if (!list.length) { UP.mount(listBox, UP.components.emptyState("No cases in this category yet", "", "list")); return; }
    UP.mount(listBox, list.map(function (c) { return UP.components.caseCard(c); }));
    if (UP.observeReveal) UP.$all(".reveal", listBox).forEach(UP.observeReveal);
    var sec = UP.$("#cat-detail"); if (sec) sec.classList.remove("hide");
  }
})();