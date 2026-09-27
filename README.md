# VaaniX — Hyperlocal Language Translator

Translate everyday English into natural Hindi, shaped by the regional expressions of Prayagraj, Varanasi, Lucknow, Agra and Patna.

## About

VaaniX is a **component-based** vanilla JavaScript web app. The main HTML page is a skeleton with empty slots; each screen section lives in its own HTML file under `components/`, and `js/app.js` fetches those files and fills them in at runtime.

## Features

- **Regional Context** — adapt translations to regional expressions (Prayagraj, Varanasi, Lucknow, Agra, Patna, Standard Hindi).
- **Multiple Languages** — English, Hindi, Bhojpuri, Maithili, Magahi, Awadhi, Braj.
- **Natural Output** — translations that feel natural to people.
- **Voice Input** — speak to translate (Web Speech API).
- **Text-to-Speech** — listen to the translation.
- **Copy & Share** — clipboard copy with fallback + native share menu.
- **Dark / Light mode** — theme toggle.
- **Accessible** — ARIA labels, `aria-live` announcements, keyboard focus styles.

## Project Structure

```
index.html                    → skeleton with empty component slots
components/
  navbar.html                 → top bar (brand + theme toggle)
  sidebar.html                → left action rail (region / history / settings)
  language-selector.html      → FROM/TO language dropdowns + swap
  region-selector.html        → region select + landmark photo backdrop
  translator.html             → input/output translation cards + action cards
  intelligence.html           → regional mode card + toggle
  features.html               → three-up feature strip
  footer.html                 → footer
  drawer.html                 → shared history / settings drawer panel
css/
  base.css                    → reset, design tokens, background, shared glass
  navbar.css                  → top bar styles
  sidebar.css                 → action rail styles
  language.css                → language bar styles
  translator.css              → translation workspace styles
  intelligence.css            → regional panel + region select styles
  region-visual.css           → landmark artwork, photo layer, scrim
  features.css                → feature strip styles
  footer.css                  → footer styles
  drawer.css                  → drawer + settings rows
  responsive.css              → tablet / mobile breakpoints
js/
  app.js                      → loads components into slots, then runs every init
  nav.js                      → sidebar actions, history, settings drawer
  language.js                 → language dropdowns, swap, region update
  region-art.js               → landmark SVG artwork + photo loading
  translator.js               → translation logic (demo language map)
  voice.js                    → speech input + text-to-speech
  clipboard.js                → copy + share
  theme.js                    → dark / light toggle
assets/regions/*.jpg          → one landmark photo per region
```

## How It Works

1. The browser loads `index.html`. It has empty `<div id="...">` slots for each section and loads all CSS + JS.
2. `js/app.js` runs last. For each slot it fetches the matching file in `components/` and injects the HTML.
3. Once every component is in the page, `startVaaniX()` calls each `init*` function in a fixed order (see the `initFunctions` list in `js/app.js`). Every one of them looks its elements up with `getElementById` and returns early if they are missing, so order is forgiving and a failed component load cannot break the rest of the app.

## The Region Visual

`js/region-art.js` owns the landmark panel and works entirely on its own — it listens to `#region` itself and does not touch `js/language.js`.

- A local photo per region is loaded into a layer that fills the whole regional panel, so the landmark is the panel's backdrop rather than a card inside it. The photo is shown whole (never cropped), over a blurred copy of itself plus a dark scrim.
- `Standard Hindi` has its own `assets/regions/standard.jpg` too, so it is a single photo like every other region.
- Behind the photo sits a hand-written inline SVG landmark (`VAANIX_REGION_ART`). It is the fallback, so it is always built, and it takes over if an image fails to load. `Standard Hindi` has no single landmark, so its silhouette is a composite of all five, drawn in the order given by `VAANIX_STRIP`.
- Nothing is requested from the network beyond the local files in `assets/`.

## Running Locally

No build step needed. Open `index.html` in a browser:

```bash
start index.html
```
or double-click `index.html`.

> Note: voice exchange uses the Web Speech API, which requires a modern browser and an active (often Chrome) connection.

## How Translation Works (Demo)

Translation is currently a **demo** driven by `js/translator.js`, which maps common phrases to their region-specific Hindi variants (e.g. Prayagraj vs. Patna). The structure is data-driven so a real translation API can be plugged in later.

## License

Built for India's linguistic diversity 🇮🇳