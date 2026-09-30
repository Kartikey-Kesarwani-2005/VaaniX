/* VAANIX - VOICE */

/* Wire up the mic (voice input) and speaker (text-to-speech) buttons. */
function initVoice() {
	const micButton = document.getElementById("micBtn");
	const speakButton = document.getElementById("speakBtn");
	const input = document.getElementById("inputText");
	const output = document.getElementById("outputText");

	if (micButton) micButton.addEventListener("click", startVoiceInput);
	if (speakButton) speakButton.addEventListener("click", speakTranslation);

	/* Listen to the microphone and put the words into the input box. */
	function startVoiceInput() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			alert("Voice input is not supported in this browser.");
			return;
		}
		const recognition = new SpeechRecognition();
		recognition.lang = getRecognitionLanguage();
		recognition.interimResults = false;
		recognition.start();
		setRecording(true);
		
		recognition.onresult = function (event) {
			input.value = event.results[0][0].transcript;
			input.dispatchEvent(new Event("input")); /* update the counter */
			setRecording(false);
		};
		recognition.onerror = function () { setRecording(false); };
		recognition.onend = function () { setRecording(false); };
	}

	/* Show or hide the red "recording" look on the mic button. */
	function setRecording(recording) {
		micButton.textContent = recording ? "🔴" : "🎙";
		if (recording) micButton.classList.add("recording");
		else micButton.classList.remove("recording");
	}

	/* Read the current translation aloud using the browser's speech. */
	function speakTranslation() {
		if (output.querySelector(".output-placeholder")) return; /* nothing yet */
		const text = output.innerText.trim();
		if (!text || !window.speechSynthesis) {
			if (!window.speechSynthesis) alert("Text-to-speech is not supported.");
			return;
		}
		window.speechSynthesis.cancel();
		const speech = new SpeechSynthesisUtterance(text);
		speech.lang = getSpeechLanguage();
		speech.rate = 0.9;
		window.speechSynthesis.speak(speech);
	}
}

/* Helpers: pick the BCP-47 tag for the Web Speech API from the dropdowns.

   The tag comes from VAANIX_LANGUAGES (js/language-data.js), so adding a language
   there is enough for speech to follow it - this used to hardcode an
   English-or-Hindi switch, which sent every other language to the recogniser
   as Hindi. */

function vaanixBcpFor(selectId, fallback) {
	const select = document.getElementById(selectId);
	if (!select) return fallback;
	/* language-data.js is a separate file and may not have loaded; without this the
	   whole speech path would throw on a missing helper. */
	if (typeof vaanixLanguage !== "function") return fallback;
	const language = vaanixLanguage(select.value);
	return language ? language.bcp : fallback;
}

/* Each fallback mirrors the default option of the dropdown it serves, so that
   if language-data.js fails to load the recogniser still matches what the bar is
   showing: English is the default "from", Hindi the default "to". */
function getRecognitionLanguage() {
	return vaanixBcpFor("fromLanguage", "en-IN");
}

/* Read the output in whatever the "to" dropdown says. */
function getSpeechLanguage() {
	return vaanixBcpFor("toLanguage", "hi-IN");
}