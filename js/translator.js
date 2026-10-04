/* VAANIX - TRANSLATOR */

/* Wire up the translate, clear, and regional-mode controls. */
function initTranslator() {
	const input = document.getElementById("inputText");
	const output = document.getElementById("outputText");
	const translateButton = document.getElementById("translateBtn");
	const translateLabel = document.getElementById("translateLabel");
	const clearButton = document.getElementById("clearBtn");
	const counter = document.getElementById("counter");
	const regionalToggle = document.getElementById("regionalToggle");
	const fromLanguage = document.getElementById("fromLanguage");
	const toLanguage = document.getElementById("toLanguage");
	const region = document.getElementById("region");
	const intelligence = document.getElementById("intelligenceText");
	const indicator = document.getElementById("regionalIndicatorText");
	const offNote = document.getElementById("regionOffNote");
	const inputNote = document.getElementById("inputNote");
	const regionPicker = document.querySelector(".region-picker");

	if (!input || !output) return;

	/* The region the user last picked, held while Regional mode is off. #region
	   is forced to Standard Hindi in that state, so without this the user's own
	   choice would be gone the moment they switched the toggle back on. */
	let chosenRegion = region ? region.value : "standard";

	/* Keep the live "x / 1000" counter in sync with what the user types, and
	   take the validation note back down the moment there is something to
	   validate. Leaving it up while the user types would have the note
	   contradicting the box it sits under.

	   One listener for both, deliberately: a second "input" listener would
	   depend on registration order to keep the two in step, and there is no
	   reason for a two-line function to be split across two. */
	input.addEventListener("input", function () {
		updateCounter();
		clearInputNote();
	});
	if (translateButton) translateButton.addEventListener("click", translateText);
	if (clearButton) clearButton.addEventListener("click", clearText);
	if (regionalToggle) regionalToggle.addEventListener("change", updateRegionalMode);

	/* The target language decides whether a regional flavour can be returned at
	   all, so the label and the note have to be re-read when it moves - and
	   moving it is not only something the dropdown does. js/language.js swaps the
	   two selects from the swap button, which lands the panel in a target that
	   takes no flavour at all.

	   This listener is what makes that swap correct, and it is the reason
	   swapLanguages() dispatches a change event instead of only writing the
	   values: a programmatic write fires nothing. */
	if (toLanguage) toLanguage.addEventListener("change", updateRegionalMode);

	/* Remember the user's own pick, but never the forced Standard Hindi: this
	   fires for the programmatic write below too, which is why the disabled
	   check matters.

	   updateRegionalMode() runs after it so the output label follows the region
	   the moment it changes. Without that the label still described the last
	   toggle press, and picking Patna could leave it reading "Standard
	   Translation" while Patna Hindi sat in the output.

	   Re-entry is safe: setRegionLocked() only dispatches a change when the
	   value actually moved, so this settles after one extra pass instead of
	   looping. */
	if (region) {
		region.addEventListener("change", function () {
			if (!region.disabled) chosenRegion = region.value;
			updateRegionalMode();
		});
	}

	/* The labels have to match the toggle from the first frame, not only after
	   the first change, or they would lie until the user touched the switch. */
	updateRegionalMode();

	/* Keep the live "x / 1000" counter in sync with what the user types. */
	function updateCounter() {
		counter.textContent = `${input.value.length} / 1000`;
	}

	/* Nothing to translate: say so under the field and stop.

	   Two things this deliberately does NOT do, both of which the old version
	   did.

	   It does not write into the output panel. That panel holds a translation,
	   and overwriting a good result because the input is empty now throws away
	   work the user may still want - the complaint belongs beside the box that
	   caused it, which is where the note sits.

	   And it does not complain until Translate is pressed. Marking the field
	   invalid on load, or while the user is mid-sentence, is nagging about
	   something that is not yet wrong.

	   The focus call is what makes the message accessible: aria-invalid and
	   aria-describedby on the field are read out when focus lands here, so the
	   note does not need a live region that would only half-work while it is
	   hidden. Translate is only ever reached by a click, so this is a real focus
	   move rather than a no-op. */
	function translateText() {
		const text = input.value.trim();
		if (!text) {
			showInputNote(input.value.length > 0);
			input.focus();
			return;
		}

		clearInputNote();

		const result = getDemoTranslation(
			text,
			fromLanguage.value,
			toLanguage.value,
			region.value,
			regionalToggle ? regionalToggle.checked : true
		);

		/* Read here rather than inside the timeout below: a second click inside
		   those 400ms would run the lookup again and overwrite the reason, and
		   the panel would then draw the notice over a real translation. */
		const missing = vaanixMissingReason();

		if (translateLabel) translateLabel.textContent = "Translating...";
		setTimeout(function () {
			if (missing) {
				renderNotAvailable(output, text, fromLanguage.value, toLanguage.value);
			} else {
				output.textContent = result;
			}
			if (translateLabel) translateLabel.textContent = "Translate with VaaniX";
		}, 400);
	}

	/* Two messages for one rule, because they are two different mistakes. An
	   empty box wants words; a box holding nothing but spaces already has
	   something in it, and "type something to translate" would read as though
	   nothing had been typed at all.

	   Text before hidden, in that order, both times: the words are in place and
	   the field is marked invalid before the note becomes visible, so the
	   description the field points at is complete at the moment focus arrives. */
	function showInputNote(spacesOnly) {
		if (!inputNote) return;
		inputNote.textContent = spacesOnly
			? "That is only spaces. Type the words you want translated."
			: "Type some text to translate.";
		input.setAttribute("aria-invalid", "true");
		inputNote.hidden = false;
	}

	/* Empty the text before hiding it, so nothing stale is left for a screen
	   reader to read out of a hidden element, and drop aria-invalid with it -
	   the two describe the same state and must not disagree. */
	function clearInputNote() {
		if (!inputNote) return;
		inputNote.textContent = "";
		inputNote.hidden = true;
		input.removeAttribute("aria-invalid");
	}

	/* Clear the input box and reset the output to its placeholder - the same
	   wording the page boots with and the same one js/language.js puts back when
	   a swap has no translation to move, so all three empty states read alike.
	   The note goes too: Clear is a deliberate reset, not a mistake, and leaving
	   the complaint up would blame the next keystroke for something already
	   undone. */
	function clearText() {
		input.value = "";
		output.innerHTML = `<span class="output-placeholder">Translation will appear here...</span>`;
		clearInputNote();
		updateCounter();
	}

	/* Regional mode is a real switch, not only a dimmer: it is what decides
	   which variant getDemoTranslation returns.

	   The output label follows the RESULT, not the switch, because those are
	   not the same thing. Standard Hindi is itself a region, so "Regional mode
	   on" plus "Standard Hindi selected" is a real state the app boots into -
	   and in it there is no variant to return, so the translation really is
	   Standard Hindi. Reading the label off the switch made that state claim
	   "Regional Translation" while handing back Standard Hindi, which is the
	   one thing a result label must never do.

	   The third thing that decides it is the target language, and it is the one
	   that decides most of the time. Every variant in the bundled table is a
	   Hindi string, so a regional flavour exists only when Hindi is what is being
	   translated into - the same rule getDemoTranslation() applies before it looks
	   for one. Without this the panel would claim a regional translation it is
	   not going to return.

	   The label still keeps the same shape ("<Flavour> Translation") across all
	   three, so the swap reads as one pair changing rather than as a different
	   kind of label. */
	function updateRegionalMode() {
		const on = !!regionalToggle && regionalToggle.checked;

		/* What actually came back: a variant only exists for a target that can
		   take one at all, for a region that has one, and Standard Hindi never
		   does. */
		const canFlavour = vaanixHasRegionalFlavour(toLanguage.value);
		const regional = on && canFlavour && !!region && region.value !== "standard";

		/* Dimmed when the region cannot reach the output at all - the switch is
		   off, or the target takes no regional flavour. With Regional mode on and
		   a Hindi target the card is fully available even while Standard Hindi is
		   the selected region, and greying it out there would read as "disabled"
		   when it is not.

		   A class rather than an inline opacity: an opacity multiplier cannot be
		   made to work here, because the card's own surface is near-black in one
		   theme and near-white in the other, so any single alpha is either too
		   faint to read or too strong to look dimmed. The colours behind
		   .intelligence-text.is-inactive in css/intelligence.css are the same
		   two steps down in both themes. */
		if (intelligence) intelligence.classList.toggle("is-inactive", !(on && canFlavour));
		if (indicator) indicator.textContent = regional ? "Regional Translation" : "Standard Translation";

		/* Three different reasons can mean "no regional flavour here", and they
		   are not interchangeable: the user's own switch, a region with no variant
		   of its own, and a target that takes no variant at all. Saying which is
		   the difference between a note that explains and a note that confuses -
		   and the third is the one a swap lands in, so it needs a real sentence
		   rather than silence. */
		if (offNote) {
			offNote.hidden = regional;
			offNote.textContent = !canFlavour
				? "Regional flavour is a Hindi feature, and " + vaanixLanguageLabel(toLanguage.value)
					+ " is the target language, so translations come back as plain "
					+ vaanixLanguageLabel(toLanguage.value)
					+ ". Switch the target to Hindi and the region you picked applies."
				: on
					? "Regional mode is on, but Standard Hindi is the selected region. "
						+ "Choose your region above for a local flavour."
					: "Regional flavour is off, so translations come back in Standard Hindi. "
						+ "Your region is kept and applies again the moment you switch it back on.";
		}

		setRegionLocked(!on);
	}

	/* Regional mode off means Standard Hindi, so the picker is disabled and
	   forced to that option rather than left enabled showing a region that is
	   being ignored. The user's own pick is restored on the way back.

	   The change event is dispatched on purpose: js/language.js and
	   js/region-art.js each listen on #region themselves, and a programmatic
	   value write fires nothing. Without it the panel would keep naming the old
	   region and keep drawing the old landmark while the select read Standard
	   Hindi. */
	function setRegionLocked(locked) {
		if (!region) return;

		const next = locked ? "standard" : chosenRegion;
		const changed = region.value !== next;

		if (changed) region.value = next;
		region.disabled = locked;
		if (regionPicker) regionPicker.classList.toggle("is-disabled", locked);

		/* Only when the value actually moved. Firing on every toggle would
		   restart the landmark cross-fade for a region that never changed. */
		if (changed) region.dispatchEvent(new Event("change", { bubbles: true }));
	}
}


/* ---------- 2. translation ---------- */

/* Regional flavour is a Hindi-output feature, and that is a property of the
   bundled table rather than a preference: every `regions` map in
   VAANIX_PHRASES holds a Hindi variant, which js/language-data.js states where
   the map is defined.

   Stated once here because two places need it - getDemoTranslation() below,
   which must not look for a variant it can never return, and updateRegionalMode()
   above, which must not label the result as regional when there is none. Written
   as one function so the label cannot drift away from the lookup.

   Named rather than inlined, and deliberately not derived from the data:
   deriving it would mean teaching VAANIX_LANGUAGES which entries carry
   variants, which is a change to the language data this app is not making. When
   a second language does get variants of its own, this is the one test to
   widen, and both callers follow it. */
function vaanixHasRegionalFlavour(to) {
	return to === "hindi";
}

/* Why the last lookup came back with nothing to show: null when it translated,
   otherwise "tables", "phrase" or "language". Written by getDemoTranslation(),
   read once straight afterwards by translateText(), and nothing else - it is a
   note between two functions in this file, not state the app holds.

   Recorded rather than folded into the return value on purpose. A string is the
   documented contract of getDemoTranslation() and the thing a real engine
   replaces, so a fetch() dropped in there has to keep working without knowing
   this exists. What the panel draws around a result is this file's business. */
let vaanixLastMissing = null;

/* The last miss, or null if the last call translated. */
function vaanixMissingReason() {
	return vaanixLastMissing;
}

/* The one place a real engine would be plugged in.

   Swap the body for a fetch() and every language pair in the UI keeps working:
   the dropdowns, the voice helpers and the regional toggle are all driven by
   VAANIX_LANGUAGES, not by anything here. Keep the return contract - a string
   on success, or the not-available sentence - and nothing else has to move.

   regional is the Regional mode toggle. Only an explicit false turns the local
   flavour off, so a caller that omits the argument keeps the regional
   behaviour instead of silently getting Standard Hindi. */
function getDemoTranslation(text, from, to, region, regional) {
	/* Cleared on the way in, every call: a reason left over from an earlier
	   miss would be read back as if it described this one. */
	vaanixLastMissing = null;

	/* The phrase tables live in js/language-data.js. If that file did not load there
	   is nothing to look up, so say so rather than throwing inside the click
	   handler and leaving the button stuck on "Translating...". */
	if (typeof vaanixFindPhrase !== "function" || typeof normalisePhrase !== "function") {
		return vaanixMissingPhrase("tables");
	}

	const phrase = vaanixFindPhrase(from, text);
	if (!phrase) return vaanixMissingPhrase("phrase");

	/* Regional mode on and the target is Hindi: the chosen region's own variant
	   wins. This has to be checked BEFORE the plain lookup below, because every
	   phrase carries a Standard Hindi in the table and that would always be
	   found first, so the variant would never be reached.

	   A region with no variant of its own - Varanasi, Agra, Standard Hindi -
	   falls through to the Standard Hindi, which is the right answer rather
	   than a miss. */
	if (regional !== false && vaanixHasRegionalFlavour(to) && phrase.regions && phrase.regions[region]) {
		return phrase.regions[region];
	}

	/* Plain translation, for every one of the 16x16 pairs. Also the path a
	   regional variant takes when it is the input: it is indexed under Hindi, so
	   the phrase is found and this returns the target language from the table. */
	if (phrase[to]) return phrase[to];

	/* The phrase is here but this language is not in it. Unreachable while the
	   catalogue is whole - js/language-data.js checks that every phrase carries
	   every language - so it is a guard against a half-edited table, and it says
	   so rather than blaming the input. */
	return vaanixMissingPhrase("language");
}

/* A miss still hands back readable text, because every outcome of
   getDemoTranslation() is a string and a real engine's callers will read it
   that way. The output panel does not show this sentence - it draws the
   not-available state in renderNotAvailable() - so this is the fallback for
   anywhere the string is used on its own.

   The sentences name the offline set instead of saying "not translated",
   because until an engine is connected that is the honest description of what
   happened: nothing was looked up, rather than a lookup going wrong. */
function vaanixMissingPhrase(reason) {
	vaanixLastMissing = reason;

	if (reason === "tables") {
		return "The offline phrase tables did not load, so there is nothing to translate from yet.";
	}

	if (reason === "language") {
		return "The offline set has this phrase, but no wording for the selected target language.";
	}

	return "This phrase is not in VaaniX's bundled offline set, so there is no translation to show.";
}

/* What the user sees when there is no translation to show.

   This replaces a plain sentence written straight into the output box, which
   had three faults: it looked exactly like a translation, it told the user
   nothing they could act on, and it was then treated as a translation by
   everything downstream - copied to the clipboard, read aloud by Listen, and
   logged into session history as if someone had typed it.

   What is on screen now is a quiet block that names the dataset it looked in,
   quotes the phrase back, and offers the phrases that ARE in it. Same
   information as before, arranged as guidance rather than as an error.

   .output-empty is load-bearing in the way .output-placeholder is: clipboard,
   Listen and the history observer all check for it so the notice is never
   mistaken for a result. Renaming it means updating all three.

   Built with createElement rather than an HTML string, because the notice
   quotes the user's own text back at them. */
function renderNotAvailable(output, text, from, to) {
	const reason = vaanixMissingReason();
	const box = document.createElement("div");
	box.className = "output-empty";

	/* Three reasons, three notices, because they are three different problems
	   with three different fixes and one blanket message would send every user
	   to the same dead end. */
	if (reason === "tables") {
		const glyph = outputNoticeGlyph(box, "!");
		glyph.classList.add("is-warning");

		outputNoticePart(box, "output-empty-title", "The offline phrases did not load");
		outputNoticePart(box, "output-empty-text", "js/language-data.js is missing or blocked, so there is "
			+ "nothing to look this up in.");
		outputNoticePart(box, "output-empty-hint", "Check that the file sits beside index.html, then reload.");
		output.replaceChildren(box);
		return;
	}

	if (reason === "language") {
		outputNoticeGlyph(box, "◌");
		outputNoticePart(box, "output-empty-title", "No wording for this pair yet");
		outputNoticePart(box, "output-empty-text", "The offline set carries this phrase, but has no "
			+ vaanixLanguageLabel(to) + " wording for it, so " + vaanixLanguageLabel(from) + " → "
			+ vaanixLanguageLabel(to) + " has nothing to show.");
		outputNoticePart(box, "output-empty-hint", "That is a gap in the bundled data, "
			+ "not something to do with what you typed.");
		output.replaceChildren(box);
		return;
	}

	/* The everyday case: real input, no entry for it. */
	const count = typeof VAANIX_PHRASES === "undefined" ? 0 : VAANIX_PHRASES.length;
	const total = typeof VAANIX_LANGUAGES === "undefined" ? 0 : VAANIX_LANGUAGES.length;

	outputNoticeGlyph(box, "◌");
	outputNoticePart(box, "output-empty-title", "Not in the offline sample set");
	outputNoticePart(box, "output-empty-text", "VaaniX runs entirely offline on " + count
		+ " sample phrases in " + total + " languages. " + vaanixQuoted(text)
		+ " is not one of them, so there is no translation to show.");

	/* The dataset named, and its contents offered. "5 phrases" is a number
	   nobody can act on; the phrases themselves are the whole of what this app
	   can translate, so listing three of them is the guidance. Quoted rather
	   than styled as buttons, because they are not buttons - nothing here is
	   clickable, and a pill that looks pressable would be a promise the page
	   cannot keep. */
	const samples = document.createElement("p");
	samples.className = "output-empty-samples";

	const samplesLabel = document.createElement("span");
	samplesLabel.className = "output-empty-samples-label";
	samplesLabel.textContent = "In the set";
	samples.appendChild(samplesLabel);

	const bundled = typeof VAANIX_PHRASES === "undefined" ? [] : VAANIX_PHRASES;
	bundled.slice(0, 3).forEach(function (phrase) {
		const sample = document.createElement("span");
		sample.className = "output-empty-sample";
		sample.textContent = "\u201c" + phrase.english + "\u201d";
		samples.appendChild(sample);
	});
	box.appendChild(samples);

	/* The hint is the one line that changes with what the user is doing. With
	   FROM on English the samples above work as they stand; with FROM on
	   anything else they cannot match, and saying "try one of these" anyway
	   would be advice that leads straight back here. */
	outputNoticePart(box, "output-empty-hint", from === "english"
		? "Type one of the samples above to get a translation in any of the " + total + " languages."
		: "The samples are English, and FROM is set to " + vaanixLanguageLabel(from)
			+ ". Switch FROM to English, or type the phrase in " + vaanixLanguageLabel(from)
			+ " as the bundled set spells it.");

	output.replaceChildren(box);
}

/* The glyph and the paragraphs are the only two shapes this notice needs, and
   both are text set by this file rather than markup from anywhere else, so
   textContent is the right tool for both. */
function outputNoticeGlyph(box, character) {
	const glyph = document.createElement("span");
	glyph.className = "output-empty-glyph";
	glyph.textContent = character;
	glyph.setAttribute("aria-hidden", "true");
	box.appendChild(glyph);
	return glyph;
}

function outputNoticePart(box, className, words) {
	const part = document.createElement("p");
	part.className = className;
	part.textContent = words;
	box.appendChild(part);
	return part;
}

/* The phrase quoted back to whoever typed it. Capped, because a pasted
   paragraph echoed in full would push the samples and the hint off the card -
   and the point of quoting it is to confirm which text was looked up, which the
   start of it does as well as the whole of it. */
function vaanixQuoted(text) {
	const words = String(text).trim();
	const short = words.length > 64 ? words.slice(0, 61).trimEnd() + "\u2026" : words;
	return "\u201c" + short + "\u201d";
}
