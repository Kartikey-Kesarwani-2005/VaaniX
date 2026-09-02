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
  hero.html                   → hero heading + intro
  language-selector.html      → FROM/TO language dropdowns + swap
  region-selector.html        → region selector
  translator.html             → input/output translation cards
  intelligence.html           → regional mode card + toggle
  features.html               → features section
  footer.html                 → footer
css/
  base.css                    → reset, tokens, background
  navbar.css                  → top bar styles
  hero.css                    → hero styles
  language.css                → language bar styles
  translator.css              → translation workspace styles
  intelligence.css            → regional card styles
  features.css                → features section styles
  footer.css                  → footer styles
  responsive.css              → tablet / mobile breakpoints
js/
  app.js                      → loads components into slots + runs init
  language.js                 → language dropdowns, swap, region update
  translator.js               → translation logic (demo language map)
  voice.js                    → speech input + text-to-speech
  clipboard.js                → copy + share
  theme.js                    → dark / light toggle
```

## How It Works

1. The browser loads `index.html`. It has empty `<div id="...">` slots for each section and loads all CSS + JS.
2. `js/app.js` runs last. For each slot it fetches the matching file in `components/` and injects the HTML.
3. Each `js/app.js`-style module registers initialization hooks so interactions (translate, voice, copy, theme) work once the content is in the page.

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