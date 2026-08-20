# Cinewall Designer

A browser-based parametric designer for built-in TV / media wall units ("cinewalls").

Lay out the unit row by row, drop in niches, doors, drawers, a TV panel or an electric
fireplace, and see the result in 3D as you type — then export a scaled elevation drawing
and a cut list you can hand to a woodworker. All measurements are in centimetres.

**▶ Live version: https://andrecarlucci.github.io/cinewall-designer/**

## What it does

- **Parametric unit** — set overall width, depth, plinth height and recess, panel
  thickness, and the finish for the carcass, back panel and plinth (oak, walnut, smoked
  oak, ash, acoustic walnut slats, microcement, marble, travertine, matte black, white,
  anthracite, greige, sage, navy).
- **Rows and columns** — stack named rows of any height, split each into columns, drag
  widths around (remaining columns rebalance automatically), equalize a row in one click,
  and toggle individual vertical dividers on or off.
- **Niche types** — open niche, door, push-to-open door, drawer, TV niche, flush TV panel,
  and electric fireplace. Doors support left/right/top (lift-up)/bottom (drop-down)
  hinges; niches can take internal shelves, a recessed false back with a front border,
  or join a continuous flush face plate that hides framing, wiring and fixings.
- **3D view** — orbit, pan and zoom; click a niche to locate it in the sidebar and to open
  its doors and drawers. Optional technical (wireframe) mode and dimension annotations.
  Niches can be dressed with books, objects, a soundbar or 1–3 speakers to judge scale.
- **Elevation** — a dimensioned front view of the whole unit, downloadable as a PNG.
- **Cut list** — every panel with quantity, width × height, thickness and build notes
  (reveals, hinge side, TV cutout sizes, recess depths, edge treatment), plus an estimate
  of the sheet material needed. Copy it to the clipboard as tab-separated text for a
  spreadsheet.
- **Undo / redo** with `Ctrl+Z` / `Ctrl+Shift+Z` (`Cmd` on macOS), autosave to the
  browser's local storage, and export/import of the whole design as a JSON file.

## Running it locally

The app is plain static HTML, CSS and JavaScript — no build step, no dependencies to
install. It does `fetch` the starting layout from `demo.json`, so it has to be served over
HTTP rather than opened as a `file://` URL:

```bash
git clone https://github.com/andrecarlucci/cinewall-designer.git
cd cinewall-designer
python3 -m http.server
# then open http://localhost:8000
```

Three.js is loaded from a CDN, so the first load needs an internet connection.

## Project layout

| Path | What's in it |
| --- | --- |
| `index.html` | Page shell: sidebar, tabs, canvases |
| `demo.json` | The example design loaded on a first visit |
| `css/styles.css` | All styling |
| `js/state.js` | Design model, geometry helpers, autosave and undo history |
| `js/sidebar.js` | The controls panel and all editing interactions |
| `js/scene3d.js` | Three.js scene, materials, decor and camera controls |
| `js/elevation.js` | Dimensioned elevation drawing and PNG export |
| `js/cutlist.js` | Cut list generation and clipboard export |
| `js/main.js` | Boot sequence, tab switching, keyboard shortcuts |

## Disclaimer

This software is provided "AS IS" without warranty of any kind. It is a design aid, not a
substitute for a joiner: verify every measurement, tolerance and hardware clearance before
cutting anything.

Made by [André Carlucci](https://www.linkedin.com/in/andrecarlucci).
