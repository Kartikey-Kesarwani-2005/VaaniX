/* VAANIX - VOICE */

/* Wire up the mic (voice input) and speaker (text-to-speech) buttons. */
function initVoice() {
	const micButton = document.getElementById("micBtn");
	const speakButton = document.getElementById("speakBtn");
	const input = document.getElementById("inputText");
	const output = document.getElementById("outputText");

	if (micButton) micButton.addEventListener("click", startVoiceInput);
	if (speakButton) speakButton.addEventListener("click", speakTranslation);

	let speaking = false;

	/* The <audio> element reused for streamed speech, and the queue guard. See
	   playChunks() and stopSpeechEngine(). */
	let player = null;
	let playToken = 0;

	/* Listen to the microphone and put the words into the input box. */
	function startVoiceInput() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			alert("Voice input is not supported in this browser.");
			return;
		}

		/* Handlers go on before start(): start() reports permission and
		   "already started" failures through onerror, so attaching them
		   afterwards could miss the failure and strand the button in its
		   recording look with no way out. */
		const recognition = new SpeechRecognition();
		recognition.lang = getRecognitionLanguage();
		recognition.interimResults = false;

		recognition.onresult = function (event) {
			input.value = event.results[0][0].transcript;
			input.dispatchEvent(new Event("input")); /* update the counter */
			setRecording(false);
		};
		recognition.onerror = function () { setRecording(false); };
		recognition.onend = function () { setRecording(false); };

		recognition.start();
		setRecording(true);
	}

	/* Show or hide the red "recording" look on the mic button. */
	function setRecording(recording) {
		micButton.textContent = recording ? "🔴" : "🎙";
		if (recording) micButton.classList.add("recording");
		else micButton.classList.remove("recording");
	}

	/* Chrome hands out an empty voice list until the voice set finishes loading
	   and then fires "voiceschanged", so a one-off getVoices() call returns []
	   on the first click. Resolve once the list is actually there.

	   A browser with no SpeechSynthesis at all resolves to nothing, which sends
	   the caller straight to the streamed path rather than throwing. */
	function speechVoices() {
		if (!window.speechSynthesis) return Promise.resolve([]);
		const ready = window.speechSynthesis.getVoices();
		if (ready.length) return Promise.resolve(ready);
		return new Promise(function (resolve) {
			let settled = false;
			function finish() {
				if (settled) return;
				settled = true;
				window.speechSynthesis.removeEventListener("voiceschanged", finish);
				resolve(window.speechSynthesis.getVoices());
			}
			window.speechSynthesis.addEventListener("voiceschanged", finish);
			/* Some builds never fire the event; do not leave Listen hanging. */
			setTimeout(finish, 1000);
		});
	}

	/* Exact tag first ("hi-IN"), then any regional variant of the same base
	   language ("hi-IN" for "hi"). Returns null when the OS has no voice for
	   the language at all, which is better than assigning a mismatched one. */
	function pickVoice(voices, tag) {
		/* Normalise both sides: some platforms report the language as "en_US"
		   rather than "en-US", and a tag that is not normalised here would match
		   no voice at all and send a language that does have one to the network. */
		const wanted = tag.toLowerCase().replace(/_/g, "-");
		const base = wanted.split("-")[0];
		let regional = null;
		for (const voice of voices) {
			const lang = voice.lang.toLowerCase().replace(/_/g, "-");
			if (lang === wanted) return voice;
			if (!regional && lang.split("-")[0] === base) regional = voice;
		}
		return regional;
	}

	/* ---------- speech output ---------- */

	/* Windows ships a TTS voice for English and Hindi and little else, so
	   SpeechSynthesis alone cannot read Marathi, Bengali, Tamil and the rest -
	   there is nothing installed for it to hand the text to.

	   So: use the installed voice when the language has one, and otherwise
	   stream the audio straight from Google's free TTS endpoint. Both are pure
	   client-side - there is no backend and no API key, it is just an <audio>
	   request the page makes itself. The endpoint sends no CORS headers, which
	   is why this uses an <audio> element rather than fetch(): media elements
	   are allowed to play a cross-origin resource unread.

	   Odia and Assamese have a voice in neither place, so those two say so
	   instead of reading the text aloud in some unrelated language. */

	/* Google tags a language by its bare code, which is the first half of the
	   BCP-47 tag already in VAANIX_LANGUAGES: "mr-IN" -> "mr". Deriving it that
	   way means a new language needs nothing added here. */
	function ttsLanguage(tag) {
		return tag.split("-")[0].toLowerCase();
	}

	function ttsUrl(language, text) {
		return "https://translate.google.com/translate_tts"
			+ "?ie=UTF-8&client=tw-ob"
			+ "&tl=" + encodeURIComponent(language)
			+ "&q=" + encodeURIComponent(text);
	}

	/* The endpoint rejects a request over roughly 200 characters with a bare
	   400, so long output is spoken as several requests in a row. Cuts prefer
	   sentence and clause ends so the chunks land where a speaker would pause
	   rather than mid-word. */
	function chunkForSpeech(text, limit) {
		/* The Arabic marks sit alongside the Devanagari danda: without "؟ "
		   Urdu output has no clause break to cut on and falls through to the bare
		   space, so a long Urdu sentence is split mid-clause. */
		const breaks = ["\n", ". ", "! ", "? ", "। ", "؟ ", "، ", ", ", "; ", " "];
		const chunks = [];
		let rest = text.trim();

		while (rest.length > limit) {
			let cut = 0;
			for (const mark of breaks) {
				const found = rest.lastIndexOf(mark, limit);
				if (found > limit * 0.35) cut = found + mark.length;
			}
			if (!cut) cut = limit;
			const piece = rest.slice(0, cut).trim();
			if (piece) chunks.push(piece);
			rest = rest.slice(cut).trim();
		}

		if (rest) chunks.push(rest);
		return chunks;
	}

	/* Play the chunks back to back on one element, so long output does not
	   leave gaps between requests. token guards against a stop that lands
	   mid-queue: it is bumped on every stop, and the old chain sees the change
	   and abandons itself. */
	function playChunks(chunks, language, token) {
		if (token !== playToken) return;
		if (!chunks.length) {
			stopSpeaking();
			return;
		}

		if (!player) player = new Audio();

		player.onended = function () {
			if (token !== playToken) return;
			playChunks(chunks.slice(1), language, token);
		};
		player.onerror = function () {
			if (token !== playToken) return;
			stopSpeaking();
			alert("Could not load the audio for this language.");
		};

		player.src = ttsUrl(language, chunks[0]);
		/* Autoplay can still be refused if the page somehow has no user
		   gesture; that rejects rather than throws. */
		const started = player.play();
		if (started && started.catch) started.catch(function () {
			if (token === playToken) stopSpeaking();
		});
	}

	/* Read the current translation aloud using the browser's speech. */
	function speakTranslation() {
		if (output.querySelector(".output-placeholder")) return; /* nothing yet */
		const text = output.innerText.trim();
		if (!text) return;

		/* Clicking again while it talks stops it instead of queueing a second
		   read of the same line. */
		if (speaking) {
			stopSpeaking();
			return;
		}

		const tag = getSpeechLanguage();
		const language = ttsLanguage(tag);

		speaking = true;
		setSpeaking(true);
		stopSpeechEngine();

		speechVoices().then(function (voices) {
			if (!speaking) return; /* stopped while we waited for the list */

			const voice = pickVoice(voices, tag);
			if (voice) {
				speakWithBrowser(text, tag, voice);
				return;
			}

			/* Odia and Assamese have a voice in neither place. Checked here
			   rather than up front so that installing the Windows voice pack
			   later is enough to make Listen work with no code change. */
			if (language === "or" || language === "as") {
				stopSpeaking();
				alert("No speech voice is available for "
					+ (language === "or" ? "Odia" : "Assamese")
					+ " yet. The translation is on screen; installing that voice "
					+ "pack in Windows would make Listen work.");
				return;
			}

			/* No installed voice, so stream it instead. */
			const token = ++playToken;
			const chunks = chunkForSpeech(text, 150);
			if (!chunks.length) {
				stopSpeaking();
				return;
			}
			player = null;
			playChunks(chunks, language, token);
		});
	}

	function speakWithBrowser(text, tag, voice) {
		const speech = new SpeechSynthesisUtterance(text);
		speech.lang = tag;
		speech.voice = voice;
		speech.rate = 0.95;
		/* Without these a dropped or failed utterance leaves the button stuck
		   showing that it is speaking. */
		speech.onend = stopSpeaking;
		speech.onerror = stopSpeaking;
		window.speechSynthesis.speak(speech);
	}

	/* One place that shuts off whichever engine is currently talking, so the
	   two cannot speak over each other. */
	function stopSpeechEngine() {
		playToken++;
		if (window.speechSynthesis) window.speechSynthesis.cancel();
		if (player) {
			player.onended = null;
			player.onerror = null;
			player.pause();
			player.removeAttribute("src");
		}
	}

	function stopSpeaking() {
		stopSpeechEngine();
		speaking = false;
		setSpeaking(false);
	}

	/* Show or hide the cyan "speaking" look on the Listen button. */
	function setSpeaking(active) {
		speakButton.textContent = active ? "⏹" : "🔊";
		if (active) speakButton.classList.add("speaking");
		else speakButton.classList.remove("speaking");
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