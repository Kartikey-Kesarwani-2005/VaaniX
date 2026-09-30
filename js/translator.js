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
	const regionPicker = document.querySelector(".region-picker");

	if (!input || !output) return;

	/* The region the user last picked, held while Regional mode is off. #region
	   is forced to Standard Hindi in that state, so without this the user's own
	   choice would be gone the moment they switched the toggle back on. */
	let chosenRegion = region ? region.value : "standard";

	input.addEventListener("input", updateCounter);
	if (translateButton) translateButton.addEventListener("click", translateText);
	if (clearButton) clearButton.addEventListener("click", clearText);
	if (regionalToggle) regionalToggle.addEventListener("change", updateRegionalMode);

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

	/* Translate the input: show a loading label, then reveal the result. */
	function translateText() {
		const text = input.value.trim();
		if (!text) {
			output.innerHTML = `<span class="output-hint">Please enter some text to translate first.</span>`;
			input.focus();
			return;
		}
		const result = getDemoTranslation(
			text,
			fromLanguage.value,
			toLanguage.value,
			region.value,
			regionalToggle ? regionalToggle.checked : true
		);

		if (translateLabel) translateLabel.textContent = "Translating...";
		setTimeout(function () {
			output.textContent = result;
			if (translateLabel) translateLabel.textContent = "Translate with VaaniX";
		}, 400);
	}

	/* Clear the input box and reset the output to its placeholder. */
	function clearText() {
		input.value = "";
		output.innerHTML = `<span class="output-placeholder">Your translation will appear here...</span>`;
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

	   Both wordings keep the same shape ("<Flavour> Translation") so the swap
	   reads as one pair changing rather than as a different kind of label. */
	function updateRegionalMode() {
		const on = !!regionalToggle && regionalToggle.checked;

		/* What actually came back: a regional variant only exists for a region
		   that has one, and Standard Hindi never does. */
		const regional = on && !!region && region.value !== "standard";

		/* Dimmed on the switch, not on the result: with Regional mode on the
		   card is fully available even while Standard Hindi is selected, and
		   greying it out would read as "disabled" when it is not. */
		if (intelligence) intelligence.style.opacity = on ? "1" : "0.45";
		if (indicator) indicator.textContent = regional ? "Regional Translation" : "Standard Translation";

		/* Two different reasons can mean "no regional flavour here", and they
		   are not interchangeable: one is the user's switch, the other is a
		   region that has no variant of its own. Saying which is the difference
		   between a note that explains and a note that confuses. */
		if (offNote) {
			offNote.hidden = regional;
			offNote.textContent = on
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

/* The one place a real engine would be plugged in.

   Swap the body for a fetch() and every language pair in the UI keeps working:
   the dropdowns, the voice helpers and the regional toggle are all driven by
   VAANIX_LANGUAGES, not by anything here. Keep the return contract - a string
   on success, or the not-bundled message - and nothing else has to move.

   regional is the Regional mode toggle. Only an explicit false turns the local
   flavour off, so a caller that omits the argument keeps the regional
   behaviour instead of silently getting Standard Hindi. */
function getDemoTranslation(text, from, to, region, regional) {
	/* The phrase tables live in js/language-data.js. If that file did not load there
	   is nothing to look up, so say so rather than throwing inside the click
	   handler and leaving the button stuck on "Translating...". */
	if (typeof vaanixFindPhrase !== "function" || typeof normalisePhrase !== "function") {
		return "The language tables (js/language-data.js) did not load, so VaaniX cannot translate right now.";
	}

	const phrase = vaanixFindPhrase(from, text);
	if (!phrase) return vaanixMissingPhrase(from, to, text);

	/* Regional mode on and the target is Hindi: the chosen region's own variant
	   wins. This has to be checked BEFORE the plain lookup below, because every
	   phrase carries a Standard Hindi in the table and that would always be
	   found first, so the variant would never be reached.

	   A region with no variant of its own - Varanasi, Agra, Standard Hindi -
	   falls through to the Standard Hindi, which is the right answer rather
	   than a miss. */
	if (regional !== false && to === "hindi" && phrase.regions && phrase.regions[region]) {
		return phrase.regions[region];
	}

	/* Plain translation, for every one of the 16x16 pairs. Also the path a
	   regional variant takes when it is the input: it is indexed under Hindi, so
	   the phrase is found and this returns the target language from the table. */
	if (phrase[to]) return phrase[to];

	return vaanixMissingPhrase(from, to, text);
}

/* Shown when the sentence is not in the bundled dictionary. Written as a
   sentence about the app rather than a bare error, because until a real engine
   is connected "not translated" is the honest and expected outcome. */
function vaanixMissingPhrase(from, to, text) {
	const first = VAANIX_PHRASES[0].english;
	const third = VAANIX_PHRASES[2].english;
	const count = VAANIX_PHRASES.length;
	const total = VAANIX_LANGUAGES.length;

	return `VaaniX ships ${count} sample phrases across ${total} languages, and this one is not among them. `
		+ `Try "${first}" or "${third}". A real engine plugs in at getDemoTranslation().`;
}
