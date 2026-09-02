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

/* Helper: pick the recognition language from the "from" dropdown. */
function getRecognitionLanguage() {
	const from = document.getElementById("fromLanguage");
	return from && from.value === "english" ? "en-IN" : "hi-IN";
}

/* Helper: pick the speech language from the "to" dropdown. */
function getSpeechLanguage() {
	const to = document.getElementById("toLanguage");
	if (!to) return "en-US";
	switch (to.value) {
		case "hindi": return "hi-IN";
		case "english": return "en-IN";
		default: return "hi-IN";
	}
}