/* VAANIX - LANGUAGE */

/* Wire up the language dropdowns, the swap button, and the region menu. */
function initLanguage() {
	const fromLanguage = document.getElementById("fromLanguage");
	const toLanguage = document.getElementById("toLanguage");
	const swapButton = document.getElementById("swapBtn");
	const region = document.getElementById("region");
	const selectedRegion = document.getElementById("selectedRegion");
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
		if (!detected) return;
		const from = fromLanguage.options[fromLanguage.selectedIndex].text;
		detected.textContent = `${from} selected`;
	}

	/* Swap the two language dropdowns with each other. */
	function swapLanguages() {
		const oldFrom = fromLanguage.value;
		fromLanguage.value = toLanguage.value;
		toLanguage.value = oldFrom;
		updateLanguageInfo();
	}

	/* Update the selected region name in the intelligence card. */
	function updateRegion() {
		if (!region) return;
		const regionName = region.options[region.selectedIndex].text;
		if (selectedRegion) selectedRegion.textContent = regionName;
		if (intelligenceText) {
			intelligenceText.innerHTML =
				`VaaniX will adapt the translation to <strong>${regionName}</strong>.`;
		}
	}
}