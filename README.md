# VaaniX — Hyperlocal Language Translator

Translate everyday English into natural Hindi and 10 other Indian languages, with the output optionally shaped by the regional expressions of Prayagraj, Varanasi, Lucknow, Agra and Patna.

## About

VaaniX is a **component-based** vanilla JavaScript web app. The main HTML page is a skeleton with empty slots; each screen section lives in its own HTML file under `components/`, and `js/app.js` fetches those files and fills them in at runtime.

## Features

- **Regional Context** — adapt translations to regional expressions (Prayagraj, Varanasi, Lucknow, Agra, Patna, Standard Hindi).
- **Multiple Languages** — English, Hindi, Bengali, Punjabi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Odia, Assamese, Urdu.
- **Regional Mode** — one toggle switches the whole app between regional output and plain Standard Hindi; switching it off disables the region select and switching it back on restores whatever region was chosen.
- **Natural Output** — translations that feel natural to people.
- **Inline validation** — an empty or whitespace-only box is caught before the dictionary is touched, and says so in one quiet line under the field rather than in the output panel. The translation already on screen is left alone, and `aria-invalid` plus `aria-describedby` carry the message to a screen reader.
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
  region-selector.html        → control bar + landmark band + confirmation card
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
  region-visual.css           → per-region palette, landmark band, photo plate, region wash
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

`js/region-art.js` owns the landmark panel and works entirely on its own — it listens to `#region` itself and does not touch `js/language.js`. It writes a single `data-region` attribute on `#regionVisual` per change, and every part of the band is switched by that one attribute.

The panel is a flex column of three zones, in document order, so the middle one is exactly the leftover height:

- **Control bar** (`.region-picker`) — full-bleed glass on the panel's top edge, holding the eyebrow and the region `<select>`. The `<select>` is the largest type in the panel: it names the place, so it is the answer to the question the eyebrow asks.
- **Landmark band** (`.region-visual`) — the region itself, between the two glass surfaces and never underneath them.
- **Confirmation card** (`.intelligence-card`) — the sentence `js/language.js` rewrites on every change, inset at the bottom.

It was an absolutely positioned full-panel backdrop before, which could not know how much room the two glass surfaces above and below needed — at the widths where the regional column becomes a full row (`css/responsive.css`, 1180px and under) the fitted photo grew past the panel and slid underneath both of them. As a flex band it is precisely the space that is left over, so the plate stays centred at every width.

Inside the band, back to front: a CSS sky/hills/river gradient scene, the inline SVG landmark, the region photo, `.visual-grade` (the region wash, vignette and hairline frame) and `.visual-grain`.

- A local photo per region is loaded into a layer that is shown **only once an image has actually loaded**. The photos are 3:2 and the band is far wider than that, so a plain `object-fit: cover` would scale to height, throw away more than half the width, and slice the top off exactly the tall landmarks worth showing. The photo is therefore shown whole as a **plate** floating over a blurred, region-tinted bed that fills the bars — nothing is ever cropped, and nothing can fail to an empty box.
- `Standard Hindi` has its own `assets/regions/standard.jpg` too, so it is a single photo like every other region.
- Behind the photo sits a hand-written inline SVG landmark (`VAANIX_LANDMARKS`). It is the fallback, so it is always built, and it takes over if an image fails to load. `Standard Hindi` has no single landmark, so its silhouette is a composite of all five, drawn in the order given by `VAANIX_STRIP`.
- **Region identity** is a palette in `css/region-visual.css`: one set of `--art-glow` / `--art-glow-2` / `--art-ink` / `--art-line` per region, with separate values for the light theme (the dark palette adds light and the light one multiplies, so they cannot be reused). Each rule is written twice on purpose — once scoped to `.region-visual[data-region=…]` and once as a `:has()` companion on `.region-panel--pick` — because the picker and the card are **siblings** of the band and cannot inherit its custom properties. The companion selectors are what carry a region's colour out to the select's border and rail, the eyebrow dash, the status dot and the card's top edge. `:has()` is the only thing here a 2023 browser would miss and nothing depends on it: drop it and the band still repaints, while the control falls back to an unaccented but still branded panel.
- Text is never laid directly over the photograph. The band is the only media surface; both glass surfaces above and below it are `--surface-over-media`, which is deliberately more opaque than `--surface-deep` in both themes, and the `<select>` is more opaque still. No region hue is ever asked to carry a contrast ratio.
- Nothing is requested from the network beyond the local files in `assets/`.

## Running Locally

**VaaniX must be served over HTTP — opening `index.html` from disk will not work.**

The page is a skeleton, and `js/app.js` fills the slots by `fetch()`-ing the files in `components/`. Browsers block that read under the `file:` scheme, so every component silently fails and you get a blank page. `js/app.js` now detects this and says so on the page instead of showing nothing.

In the VaaniX folder:

```bash
python -m http.server 8000
```

then open <http://localhost:8000>. In VS Code, right-click `index.html` and choose **Open with Live Server** instead.

> Note: voice **input** uses the Web Speech API, which requires a modern browser and an active (often Chrome) connection.

## How Listen Works

Listen picks its voice in two steps, because the browser alone cannot cover these languages:

1. **An installed voice first.** If the OS has a voice matching the target language, the Web Speech API reads it — instant and offline. This is how English and Hindi work on a default Windows install.
2. **Google's TTS endpoint as a fallback.** Windows ships no voice for Marathi, Bengali, Punjabi, Gujarati, Tamil, Telugu, Kannada or Malayalam, so there would be nothing for `speechSynthesis` to hand the text to. For those, the page streams the audio straight from `translate.google.com/translate_tts` via an `<audio>` element. No backend, no API key, no key in the repo — it is one request the page makes itself. Output over ~150 characters is split into several requests, because the endpoint rejects longer ones, and they play back to back.

Two details worth knowing if you touch this:

- The endpoint sends no CORS headers, which is why playback goes through an `<audio>` element rather than `fetch()`. Media elements may play a cross-origin resource unread; `fetch()` may not.
- Odia and Assamese have a voice in **neither** place, so those two say so rather than reading the text in an unrelated language. Installing the Windows voice pack for them is enough to make Listen work — no code change.

Both engines are shut down through one path, so a second click stops whatever is currently talking instead of talking over it.

## How Translation Works

Translation is **not** connected to any service. `js/language-data.js` ships a small bundled dictionary of everyday phrases, each carrying one field per language plus an optional `regions` map of regional Hindi variants.

- `getDemoTranslation(text, from, to, region, regional)` in `js/translator.js` looks the phrase up and returns the target language, preferring the chosen region's variant when Regional mode is on and the target is Hindi. A region with no variant of its own falls back to Standard Hindi.
- The lookup is case-, spacing- and punctuation-insensitive, and regional variants are indexed under Hindi too, so pasted regional Hindi translates back.
- A phrase outside the bundled set gets an honest notice rather than a made-up translation — see below.

**This is the single swap point for a real engine.** Replace the body of `getDemoTranslation()` with a `fetch()` and every language pair keeps working: the dropdowns, the speech helpers and the Regional mode toggle are all driven by `VAANIX_LANGUAGES`, not by the lookup. Keep the contract — return a string — and nothing else has to move. The miss path disappears along with it: a real engine returning a string is rendered as a translation, and `.output-empty` is simply never drawn.

Adding a language means adding one entry to `VAANIX_LANGUAGES` and one field to every phrase; both dropdowns, the BCP-47 speech tags and the detection text follow from that.

## The Not-available State

A miss used to be written into the output box as a plain sentence, which made it indistinguishable from a translation — and so it was copied, shared, read aloud by Listen and logged into session history as though someone had translated it. It is now a styled block instead. The panel names the offline dataset it looked in, quotes the phrase back, and lists the phrases that *are* in it, with a hint that changes depending on whether FROM is on English — because the samples it lists cannot match a non-English FROM, and "try one of these" would be advice leading straight back here.

- `getDemoTranslation()` still returns a string, so it stays a drop-in swap point for a real engine. It also records *why* it came back empty (`vaanixMissingReason()`), and `translateText()` reads that once to pick which shape to draw.
- `renderNotAvailable()` in `js/translator.js` builds the block with `createElement`, never an HTML string, because it quotes the user's own text back. Three reasons get three notices — the phrase is outside the set, the phrase exists but has no wording for that language pair, or `js/language-data.js` did not load at all — because they have three different fixes.
- `.output-empty` is the marker, in the way `.output-placeholder` already is: `js/clipboard.js`, `js/voice.js` and `js/nav.js` each query for it, so the notice is never treated as a result. Renaming it means updating all three.

The style is an inset note in muted text rather than a warning panel, and it uses only the existing theme tokens, so light mode needs nothing. A phrase outside the demo dataset is the expected behaviour of an offline demo, not a failure, and dressing it up as an error would make the app look broken for a limitation it states plainly.

## Right-to-left Text

Urdu is the only right-to-left language in the catalogue, and it is marked with `rtl: true` in `VAANIX_LANGUAGES`. `js/language.js` reads that flag and sets `dir` on two elements only: the input textarea, which holds the FROM language, and the output area, which holds the TO language. They are set separately because those two can differ — Urdu as the source is right-to-left typing, Urdu as the target is right-to-left output, and Urdu on one side with English on the other is the ordinary case.

Only the text areas are mirrored. The selects, region panel, action rail and footer stay left-to-right in every combination, because mirroring the chrome as well would move controls the user has already learned the position of. Two mirrored text areas cost less than a mirrored page.

A new right-to-left language needs no code change: add the entry with `rtl: true` and give every phrase a field for it. Anything without the flag is left-to-right, which is the correct answer for every language not marked.

## The Swap Button

The ⇄ button used to exchange the two dropdown values and nothing else, which left the workspace describing itself wrongly: after a swap FROM named the language of the answer and TO named the language of the question, and with Urdu involved `dir` flipped to match the new labels while the text underneath stayed in the old one.

`swapLanguages()` in `js/language.js` now moves the pair with the labels. The translation becomes the new input and the source becomes the new output — and that is not an approximation. Every phrase in `VAANIX_PHRASES` carries every language, so re-running the lookup for the new direction would return exactly the string already in the box. That is why the swap is instant, with no "Translating..." pause.

Three details keep the rest of the app in step, all of them by existing means rather than by reaching across files:

- Both selects get a bubbling `change` event. A programmatic value write fires nothing, and `js/translator.js` listens on `#toLanguage` to re-read the regional state — which a swap invalidates. It is the same reason `setRegionLocked()` dispatches on `#region`.
- An `input` event fires on the textarea, so the live counter and the validation note belong to `js/translator.js` and follow the moved text without either file knowing the other exists. Same handshake `js/nav.js`'s `restore()` uses.
- `window.vaanixSuppressHistory` is set across the write. The history observer watches `#outputText`, and a swap would otherwise be logged as a fresh translation — a pair the user never asked for, and one already in the list from the translation that produced it. It is cleared on the next tick.

Two states have nothing to move, so only the languages change and the output goes back to its placeholder: nothing translated yet, and a miss. `.output-placeholder` and `.output-empty` are the markers for those, the same two `js/clipboard.js`, `js/voice.js` and `js/nav.js` already query for. The user's own input is left untouched in both cases — the text is theirs.

One case cannot be repaired: edit the input without pressing Translate and the output still holds the previous pair, so that pair's translation is what moves across. It travels in the right direction, and Translate replaces it in a click — the same staleness the output panel already has while the input is being edited.

Swapping also settles a question the Regional mode panel used to get wrong. Every variant in the bundled table is a Hindi string, so after Hindi → English the panel was still claiming "Regional Translation" for a result that is plain English. `vaanixHasRegionalFlavour()` in `js/translator.js` is now the single test both the label and `getDemoTranslation()` read, so the indicator can only describe a variant that can actually come back, and the note under the switch says which of the three reasons applies — the switch, the region, or a target language that takes no flavour at all.

## License

Built for India's linguistic diversity 🇮🇳