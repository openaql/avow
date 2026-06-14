<div align="center"><img src="https://raw.githubusercontent.com/openaql/avow/refs/heads/master/assets/icons/icon.svg" alt="Avow logo" width="104" height="104" />

# Avow
**Avow** is an open-source criminal case documentation and legal research platform that helps users record, organize, and analyze alleged criminal incidents while identifying potentially applicable laws across different jurisdictions. It aims to improve transparency, legal awareness, and structured case documentation through a searchable and evidence-focused approach.</div>

## Table of Contents
- [Routing](#routing)
- [PWA and Offline](#pwa-and-offline)
- [Contributing](#contributing)

## Routing
| Screen | URL |
| --- | --- |
| Home | `index.html` |
| Categories (grid) | `categories.html` |
| Single category | `categories.html?cat=<categoryId>` |
| Search / all cases | `search.html` (optional `?q=` / `?view=cases`) |
| Profile directory | `profile.html` |
| Single profile | `profile.html?id=<personId>` |
| Case detail | `case.html?id=<caseId>` |
| Offline fallback | `offline.html` (served by the service worker) |

All query parameters are treated as lookup keys only they are never echoed into the DOM as HTML.

## PWA and Offline
- **`pwa/manifest.json`** name, full icon set (192/512 + maskable + SVG), standalone display, theme/background colors, app shortcuts, scope `../`.
- **`pwa/service-worker.js`** precaches the app shell on install; **cache-first** for shell assets, **stale-while-revalidate** for `data/*.json`, **network-first** for navigations with `offline.html` fallback. Caches are versioned and auto-cleaned on activate.
- **Install** `ui.js` captures `beforeinstallprompt` and shows a custom install banner, then registers the worker.

> [!IMPORTANT]
> The service worker precaches the shell, so **bump `CACHE_VERSION` in
> `pwa/service-worker.js` whenever you change shipped HTML/CSS/JS or icons**
> otherwise installed clients keep serving the old cached files.

## Contributing
Contributions are welcome! We appreciate bug fixes, accessibility improvements, documentation updates, code cleanups, performance enhancements, and new icon/category presets. Feel free to open an issue, submit a pull request, or suggest new ideas to help improve the project.

1. Fork and create a feature branch.
2. Keep the **no-dependency, no-build, no-`innerHTML`** constraints intact.
3. Bump `CACHE_VERSION` if you changed shell assets.
4. Open a PR describing the change.

By contributing, you agree that your contributions are licensed under the project's Apache-2.0 license.