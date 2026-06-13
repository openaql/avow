(function () {
  "use strict";
  var UP = window.UP, el = UP.el, icon = UP.icon;
  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }

  var state = { q: "", category: "", status: "", year: "", location: "", minScore: 0, arrested: false, trending: false, featured: false, sort: "" };
  var ALL = [], IDX = null;

  ready(function () {
    Promise.all([UP.loadIndex(), UP.loadAllCases()]).then(function (res) {
      IDX = res[0]; ALL = res[1];
      var colors = {}; IDX.categories.forEach(function (c) { colors[c.id] = c.color; });
      UP.components.setCategoryColors(colors);
      readParams();
      buildFilters();
      syncUI();
      apply();
    });
  });

  function readParams() {
    state.q = UP.qs("q");
    state.category = UP.qs("category");
    state.sort = UP.qs("sort");
    state.trending = UP.qs("trending") === "1";
    state.featured = UP.qs("featured") === "1";
  }

  function headingFor() {
    if (state.featured) return ["Featured Cases", "Editor-highlighted cases from the archive"];
    if (state.trending) return ["Trending Cases", "Cases drawing the most attention right now"];
    if (state.sort === "recent") return ["Recent Cases", "The most recently documented cases"];
    if (state.category && IDX) { var c = IDX.categories.find(function (x) { return x.id === state.category; }); if (c) return [c.label, "All documented cases in this category"]; }
    return null;
  }

  function syncUI() {
    var input = UP.$("#q"); if (input && state.q) input.value = state.q;
    var sel = UP.$("#category"); if (sel && state.category) sel.value = state.category;
    var h = headingFor();
    if (h) {
      var t = UP.$(".page-title"); if (t) t.textContent = h[0];
      var s = UP.$(".page-sub"); if (s) s.textContent = h[1];
      document.title = h[0] + " | Avow";
    }
  }

  function unique(getter) { var s = {}; ALL.forEach(function (c) { var v = getter(c); if (v) s[v] = 1; }); return Object.keys(s).sort(); }

  function buildFilters() {
    var input = UP.$("#q");
    if (input) UP.on(input, "input", UP.debounce(function () { state.q = input.value; apply(); }, 120));

    var panel = UP.$("#filters"); if (!panel) return;
    var cats = [""].concat(IDX.categories.map(function (c) { return c.id; }));
    var statuses = [""].concat(Object.keys(UP.STATUS_LABEL));
    var years = [""].concat(unique(function (c) { return UP.yearOf(c.date); }).reverse());
    var locs = [""].concat(unique(function (c) { return c.location; }));

    function select(id, label, options, labelFn) {
      var sel = el("select", { id: id, "aria-label": label }, options.map(function (o) {
        return el("option", { value: o, text: o === "" ? "All" : (labelFn ? labelFn(o) : o) });
      }));
      UP.on(sel, "change", function () { state[id] = sel.value; apply(); });
      return el("div", { "class": "field" }, [el("label", { "for": id, text: label }), sel]);
    }

    var score = el("input", { id: "minScore", type: "range", min: "0", max: "100", step: "5", value: "0", "aria-label": "Minimum signal score" });
    var scoreVal = el("span", { "class": "mut tabnum", text: "0" });
    UP.on(score, "input", function () { state.minScore = UP.num(score.value); scoreVal.textContent = score.value; apply(); });

    var arrested = el("input", { id: "arrested", type: "checkbox" });
    UP.on(arrested, "change", function () { state.arrested = arrested.checked; apply(); });

    UP.mount(panel, [
      select("category", "Crime Type", cats, function (id) { var c = IDX.categories.find(function (x) { return x.id === id; }); return c ? c.label : id; }),
      select("status", "Status", statuses, function (s) { return UP.STATUS_LABEL[s] || s; }),
      select("year", "Year", years),
      select("location", "Location", locs),
      el("div", { "class": "field" }, [
        el("label", { "for": "minScore" }, [UP.text("Min Signal Score: "), scoreVal]),
        el("div", { "class": "range-row" }, [score])
      ]),
      el("div", { "class": "field" }, [
        el("label", { "class": "row", style: { gap: "8px", cursor: "pointer" } }, [arrested, UP.text("Arrest status only (arrested / on trial / convicted)")])
      ])
    ]);

    var toggle = UP.$("#filter-toggle");
    if (toggle) UP.on(toggle, "click", function () {
      var open = panel.classList.toggle("hide");
      toggle.setAttribute("aria-expanded", String(!open));
    });
  }

  function apply() {
    var list = UP.searchCases(ALL, state.q);
    list = list.filter(function (c) {
      if (state.category && c.category !== state.category) return false;
      if (state.status && c.status !== state.status) return false;
      if (state.year && UP.yearOf(c.date) !== state.year) return false;
      if (state.location && c.location !== state.location) return false;
      if (c.signalScore < state.minScore) return false;
      if (state.arrested && ["arrested", "on_trial", "convicted"].indexOf(c.status) === -1) return false;
      if (state.trending && !c.trending) return false;
      if (state.featured && !c.featured) return false;
      return true;
    });
    if (state.sort === "recent") { list = list.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }); }
    var box = UP.$("#results"); var count = UP.$("#result-count");
    if (count) count.textContent = list.length + (list.length === 1 ? " result" : " results");
    if (!box) return;
    if (!list.length) { UP.mount(box, UP.components.emptyState("No matching cases", "Try adjusting your filters or search terms.", "search")); return; }
    UP.mount(box, list.map(function (c) { return UP.components.caseCard(c); }));
    if (UP.observeReveal) UP.$all(".reveal", box).forEach(UP.observeReveal);
  }
})();