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

	if (!input || !output) return;

	input.addEventListener("input", updateCounter);
	if (translateButton) translateButton.addEventListener("click", translateText);
	if (clearButton) clearButton.addEventListener("click", clearText);
	if (regionalToggle) regionalToggle.addEventListener("change", updateRegionalMode);

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
		const result = getDemoTranslation(text, fromLanguage.value, toLanguage.value, region.value);

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

	/* Dim / brighten the regional intelligence card based on the toggle. */
	function updateRegionalMode() {
		if (!intelligence) return;
		intelligence.style.opacity = regionalToggle.checked ? "1" : "0.45";
	}
}

/* Map of demo sentences: English -> regional Hindi variants per region. */
const DEMO_TRANSLATIONS = {
	"where are you going?": {
		prayagraj: "कहाँ जा रहे हो?",
		patna: "कहाँ जा रहल बाड़ऽ?",
		lucknow: "तू कहाँ जात है?",
		standard: "आप कहाँ जा रहे हैं?"
	},
	"what are you doing?": {
		prayagraj: "का कर रहे हो?",
		patna: "का करत बाड़ऽ?",
		lucknow: "का करत हौ?",
		standard: "आप क्या कर रहे हैं?"
	},
	"how are you?": {
		prayagraj: "कैसे हो?",
		patna: "कैसन बाड़ऽ?",
		lucknow: "कैसन हौ?",
		standard: "आप कैसे हैं?"
	}
};

/* Return a demo translation. Placeholder — replace with a real API later. */
function getDemoTranslation(text, from, to, region) {
	/* English -> Hindi: look up the sentence, then the region variant. */
	if (from === "english" && to === "hindi") {
		const entry = DEMO_TRANSLATIONS[text.toLowerCase()];
		if (entry) return entry[region] || entry.standard;
	}

	/* Hindi -> English: reverse lookup returns the English sentence. */
	if (from === "hindi" && to === "english") {
		for (const english in DEMO_TRANSLATIONS) {
			const variants = DEMO_TRANSLATIONS[english];
			for (const regionKey in variants) {
				if (text === variants[regionKey]) return english;
			}
		}
	}

	return `Demo translation for: ${text}`;
}