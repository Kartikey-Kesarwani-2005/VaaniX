/* VAANIX - LANGUAGE */

/* Wire up the language dropdowns, the swap button, and the region menu. */
function initLanguage() {
	const fromLanguage = document.getElementById("fromLanguage");
	const toLanguage = document.getElementById("toLanguage");
	const swapButton = document.getElementById("swapBtn");
	const region = document.getElementById("region");
	const intelligenceText = document.getElementById("intelligenceText");
	const detected = document.getElementById("detectedText");

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

		const input = document.getElementById("inputText");
		if (input) input.dir = directionFor(fromLanguage.value);

		const output = document.getElementById("outputText");
		if (output) output.dir = directionFor(toLanguage.value);
	}

	/* Swap the two language dropdowns with each other. */
	function swapLanguages() {
		const oldFrom = fromLanguage.value;
		fromLanguage.value = toLanguage.value;
		toLanguage.value = oldFrom;
		updateLanguageInfo();
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