/* VAANIX - LANGUAGE */

/* Wire up the language dropdowns, the swap button, and the region menu. */
function initLanguage() {
	const fromLanguage = document.getElementById("fromLanguage");
	const toLanguage = document.getElementById("toLanguage");
	const swapButton = document.getElementById("swapBtn");
	const region = document.getElementById("region");
	const intelligenceText = document.getElementById("intelligenceText");
	const detected = document.getElementById("detectedText");

	/* The two text areas, for the direction rules and for the swap. Not guarded:
	   a missing text area must not cost the language labels and the swap, so
	   both callers check before touching the text. */
	const input = document.getElementById("inputText");
	const output = document.getElementById("outputText");

	if (!fromLanguage || !toLanguage || !swapButton) return;

	fromLanguage.addEventListener("change", updateLanguageInfo);
	toLanguage.addEventListener("change", updateLanguageInfo);
	swapButton.addEventListener("click", swapLanguages);
	if (region) region.addEventListener("change", updateRegion);

	updateLanguageInfo();
	updateRegion();

	/* Show which "from" language is currently chosen. */
	function updateLanguageInfo() {
		if (detected) {
			const from = fromLanguage.options[fromLanguage.selectedIndex].text;
			detected.textContent = `${from} selected`;
		}

		/* Applied outside the `detected` guard: the direction of the text areas
		   does not depend on the label being present, and a missing label should
		   not cost the RTL fix. */
		applyTextDirection();
	}

	/* Urdu is the one right-to-left language in the catalogue, and the two text
	   areas hold different languages - the textarea has the FROM language, the
	   output has the TO language - so each has to follow its own. Urdu as the
	   source is right-to-left typing; Urdu as the target is right-to-left
	   output; Urdu on one side with English on the other is the ordinary case,
	   which is why this cannot be a one-time page-level switch.

	   Only the text areas get `dir`. The chrome around them - the selects, the
	   region panel, the action rail - stays left-to-right in every combination,
	   because mirroring that too would move controls the user has already
	   learned the position of. Two mirrored text areas cost less than a
	   mirrored page, and the mixed result reads correctly.

	   The check reads `rtl` off the catalogue entry rather than testing for
	   "urdu", so the next right-to-left language is a data change and not a
	   code change. Anything missing the flag is left-to-right, which is the
	   right answer for every language that is not marked. */
	function applyTextDirection() {
		const directionFor = function (code) {
			const language = typeof vaanixLanguage === "function" ? vaanixLanguage(code) : null;
			return language && language.rtl ? "rtl" : "ltr";
		};

		if (input) input.dir = directionFor(fromLanguage.value);
		if (output) output.dir = directionFor(toLanguage.value);
	}

	/* Swap the two languages - and the two texts with them.

	   Swapping the dropdowns on its own leaves the workspace lying to the user.
	   FROM said English over "How are you?" and TO said Tamil over the Tamil
	   answer; after a values-only swap each label describes the other box, and
	   with Urdu on one side it is worse - applyTextDirection() flips the dir to
	   match the new label while the text under it is still in the old language.

	   So the text moves too: the translation becomes the new input, and the
	   source becomes the new output. That pair is not an approximation. Every
	   phrase in VAANIX_PHRASES carries every language, so running the lookup
	   for the new direction would return exactly the string that was already in
	   the box - which is why there is no translation to run here and no
	   "Translating..." pause to wait through.

	   The one case this cannot repair is a stale output: type a new sentence
	   without pressing Translate and the output still holds the previous pair,
	   so what moves across is that pair's translation. It travels in the right
	   direction and Translate overwrites it in a click, which is the same
	   staleness the output panel already has while the input is being edited.

	   A miss is the case where there is nothing to move: the output holds the
	   not-available notice or the placeholder, so only the languages move and the
	   output goes back to its placeholder - a notice about the direction just
	   left is not a translation in the new one either. The input is left alone
	   in that case, because the user typed it and it is theirs. */
	function swapLanguages() {
		const oldFrom = fromLanguage.value;
		fromLanguage.value = toLanguage.value;
		toLanguage.value = oldFrom;

		/* Set before anything is written. nav.js's history observer watches
		   #outputText, and moving text into it would otherwise be logged as a
		   fresh translation - work the user did not ask for, and a pair already
		   in the list from the translation that produced it. Same handshake
		   restore() uses, for the same reason. */
		window.vaanixSuppressHistory = true;

		/* Both events, not just the values: a programmatic write fires nothing,
		   and js/translator.js listens on #toLanguage to re-read the regional
		   state, which is precisely what this swap invalidates. Same reason
		   setRegionLocked() dispatches on #region. */
		fromLanguage.dispatchEvent(new Event("change", { bubbles: true }));
		toLanguage.dispatchEvent(new Event("change", { bubbles: true }));

		if (input && output) {
			/* The two markers js/clipboard.js, js/voice.js and js/nav.js already
			   use to tell a result from the rest. A placeholder or the
			   not-available notice is not a translation, and neither is an empty
			   box. */
			const result = output.textContent.trim();
			const translated = !!result && !output.querySelector(".output-placeholder, .output-empty");

			if (translated) {
				/* Read before the write: after input.value is replaced the old
				   source is gone, and it is the new output. */
				const source = input.value;
				input.value = result;
				/* The counter and the validation note belong to js/translator.js,
				   which listens for this event - so dispatching it is how the new
				   length and the cleared note arrive without either file reaching
				   into the other. Same as nav.js's restore(). */
				input.dispatchEvent(new Event("input", { bubbles: true }));
				output.textContent = source;
			} else {
				/* Same wording the page boots with, so the empty states agree
				   whatever put them there. */
				output.innerHTML = `<span class="output-placeholder">Translation will appear here...</span>`;
			}
		}

		/* Cleared on the next tick, once the writes above have been delivered to
		   nav.js's observer. */
		window.setTimeout(function () {
			window.vaanixSuppressHistory = false;
		}, 0);
	}

	/* Update the intelligence card to name the current region. This replaces
	   the card's whole innerHTML, which is why the markup in
	   components/region-selector.html is only a pre-boot placeholder. */
	function updateRegion() {
		if (!region) return;
		const regionName = region.options[region.selectedIndex].text;
		if (intelligenceText) {
			intelligenceText.innerHTML =
				`VaaniX will adapt the translation to <strong>${regionName}</strong>.`;
		}
	}
}