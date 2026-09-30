# VaaniX — Hyperlocal Language Translator

Translate everyday English into natural Hindi and 10 other Indian languages, with the output optionally shaped by the regional expressions of Prayagraj, Varanasi, Lucknow, Agra and Patna.

## About

VaaniX is a **component-based** vanilla JavaScript web app. The main HTML page is a skeleton with empty slots; each screen section lives in its own HTML file under `components/`, and `js/app.js` fetches those files and fills them in at runtime.

## Features

- **Regional Context** — adapt translations to regional expressions (Prayagraj, Varanasi, Lucknow, Agra, Patna, Standard Hindi).
- **Multiple Languages** — English, Hindi, Bengali, Punjabi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Odia, Assamese.
- **Regional Mode** — one toggle switches the whole app between regional output and plain Standard Hindi; switching it off disables the region select and switching it back on restores whatever region was chosen.
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
  language-data.js            → language catalogue + bundled phrase dictionary
  region-art.js               → landmark SVG artwork + photo loading
  translator.js               → translation logic, regional resolution, swap point for a real engine
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
- Behind the photo sits a hand-written inline SVG landmark (`VAANIX_LANDMARKS`). It is the fallback, so it is always built, and it takes over if an image fails to load. `Standard Hindi` has no single landmark, so its silhouette is a composite of all five, drawn in the order given by `VAANIX_STRIP`.
- Nothing is requested from the network beyond the local files in `assets/`.

## Running Locally

**VaaniX must be served over HTTP — opening `index.html` from disk will not work.**

The page is a skeleton, and `js/app.js` fills the slots by `fetch()`-ing the files in `components/`. Browsers block that read under the `file:` scheme, so every component silently fails and you get a blank page. `js/app.js` now detects this and says so on the page instead of showing nothing.

In the VaaniX folder:

```bash
python -m http.server 8000
```

then open <http://localhost:8000>. In VS Code, right-click `index.html` and choose **Open with Live Server** instead.

> Note: voice exchange uses the Web Speech API, which requires a modern browser and an active (often Chrome) connection.

## How Translation Works

Translation is **not** connected to any service. `js/language-data.js` ships a small bundled dictionary of everyday phrases, each carrying one field per language plus an optional `regions` map of regional Hindi variants.

- `getDemoTranslation(text, from, to, region, regional)` in `js/translator.js` looks the phrase up and returns the target language, preferring the chosen region's variant when Regional mode is on and the target is Hindi. A region with no variant of its own falls back to Standard Hindi.
- The lookup is case-, spacing- and punctuation-insensitive, and regional variants are indexed under Hindi too, so pasted regional Hindi translates back.
- A phrase outside the bundled set gets an honest "not bundled" message rather than a made-up translation.

**This is the single swap point for a real engine.** Replace the body of `getDemoTranslation()` with a `fetch()` and every language pair keeps working: the dropdowns, the speech helpers and the Regional mode toggle are all driven by `VAANIX_LANGUAGES`, not by the lookup. Keep the contract — return a string — and nothing else has to move.

Adding a language means adding one entry to `VAANIX_LANGUAGES` and one field to every phrase; both dropdowns, the BCP-47 speech tags and the detection text follow from that.

## License

Built for India's linguistic diversity 🇮🇳