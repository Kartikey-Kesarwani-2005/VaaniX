/* VAANIX - VOICE */

/* Wire up the mic (voice input) and speaker (text-to-speech) buttons.

   Every way speech can fail - no API in the browser, permission refused, no
   microphone, no voice installed for the language, a blocked or failed audio
   fetch - is reported inline on the action card that owns the button, rather
   than through alert(). An alert is modal, unstyled, and interrupts whatever
   the reader was doing, and it cannot say which of the two buttons is at
   fault. The console still gets the raw error code and stack. */

/* Each action card's .action-desc doubles as the message surface for the
   button sitting on it, so a failure appears next to the control that caused
   it. The resting label is remembered so the default state can be restored
   exactly, rather than re-guessed. */
const cardNotes = new WeakMap();

function noteSlot(button) {
	const card = button && button.closest(".action-card");
	const desc = card && card.querySelector(".action-desc");
	if (!desc) return null;
	if (!cardNotes.has(desc)) {
		cardNotes.set(desc, desc.textContent);
		if (!desc.id) desc.id = "note-" + (button.id || "action");
	}
	return desc;
}

/* Show a message on a button's card. `detail` is for the console only - it
   never reaches the page, so status codes and error enums stay debuggable
   without ending up in front of a reader. `tone` defaults to "error"; callers
   with a different kind of message (js/clipboard.js reports "Copied" and
   "nothing to copy yet" here too) pass their own. */
function showCardNote(button, message, detail, tone) {
	const desc = noteSlot(button);
	if (!desc) return;
	if (detail !== undefined) console.warn("[VaaniX] " + (button.id || "action") + ": " + detail);
	desc.textContent = message;
	desc.setAttribute("data-tone", tone || "error");
	/* Ties the message to the control without a live region. The button's
	   aria-label stays "Listen to translation" / "Voice input", so the
	   description is where the reason belongs - and unlike a live region this
	   cannot announce twice. */
	button.setAttribute("aria-describedby", desc.id);
}

function clearCardNote(button) {
	const desc = noteSlot(button);
	if (!desc || !desc.hasAttribute("data-tone")) return;
	desc.textContent = cardNotes.get(desc);
	desc.removeAttribute("data-tone");
	button.removeAttribute("aria-describedby");
}

/* A Web Speech error code turned into something worth reading. Unmapped codes
   fall through to a generic line rather than showing the enum. */
function describeRecognitionError(code) {
	switch (code) {
		case "not-allowed":
		case "service-not-allowed":
			return "Microphone access was blocked. Allow it for this site in your browser, then try again.";
		case "audio-capture":
			return "No microphone was found. Check that one is connected, then try again.";
		case "network":
			return "Voice input needs a network connection. It is not available offline.";
		case "no-speech":
			return "Nothing was picked up. Try again a little closer to the microphone.";
		case "language-not-supported":
			return "Voice input is not available for that language yet. Try another one, or type instead.";
		default:
			return "Voice input stopped unexpectedly. Try again.";
	}
}

function initVoice() {
	const micButton = document.getElementById("micBtn");
	const speakButton = document.getElementById("speakBtn");
	const input = document.getElementById("inputText");
	const output = document.getElementById("outputText");

	/* The recogniser is resolved once here rather than per click, so the
	   button's availability is known before anyone presses it. */
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

	if (micButton) {
		micButton.addEventListener("click", startVoiceInput);
		if (!SpeechRecognition) {
			/* aria-disabled rather than disabled: a disabled button leaves the
			   tab order, so a screen-reader user would never find the control
			   that explains why voice input is missing. Clicks are ignored
			   below instead. */
			micButton.setAttribute("aria-disabled", "true");
			micButton.classList.add("is-unavailable");
			micButton.title = "Voice input is not available in this browser";
			showCardNote(
				micButton,
				"Voice input is not available in this browser. Typing still works.",
				"no window.SpeechRecognition / window.webkitSpeechRecognition"
			);
		}
	}
	if (speakButton) speakButton.addEventListener("click", speakTranslation);

	let recognition = null;

	/* Listen to the microphone and put the words into the input box. */
	function startVoiceInput() {
		if (!SpeechRecognition) {
			/* Already explained at startup; re-assert it so the note is there
			   even if something cleared it in between. */
			showCardNote(
				micButton,
				"Voice input is not available in this browser. Typing still works.",
				"click on a button marked aria-disabled"
			);
			return;
		}

		/* Pressing the mic again while it is listening stops it, rather than
		   calling start() on a live recogniser - which throws. */
		if (recognition) {
			recognition.stop();
			recognition = null;
			setRecording(false);
			return;
		}

		clearCardNote(micButton);

		/* Handlers go on before start(): start() reports permission and
		   "already started" failures through onerror, so attaching them
		   afterwards could miss the failure and strand the button in its
		   recording look with no way out. */
		const session = new SpeechRecognition();
		recognition = session;
		session.lang = getRecognitionLanguage();
		session.interimResults = false;

		session.onresult = function (event) {
			recognition = null;
			setRecording(false);
			/* Cleared here rather than only on the next click, so a good result
			   always leaves the card showing its resting label. */
			clearCardNote(micButton);
			const transcript = event.results[0] && event.results[0][0];
			/* A result with no words still fires onresult; saying nothing would
			   look like the button is broken. */
			if (!transcript || !transcript.transcript.trim()) {
				showCardNote(
					micButton,
					"Nothing was picked up. Try again a little closer to the microphone.",
					"onresult with an empty transcript"
				);
				return;
			}
			if (!input) return;
			input.value = transcript.transcript;
			input.dispatchEvent(new Event("input")); /* update the counter */
		};

		session.onerror = function (event) {
			recognition = null;
			setRecording(false);
			const code = event && event.error;
			console.warn("[VaaniX] speech recognition error:", code, event);
			/* "aborted" is what a deliberate stop() reports, so treating it as
			   a failure would scold the reader for using the button correctly. */
			if (code === "aborted") return;
			showCardNote(micButton, describeRecognitionError(code), "onerror code=" + code);
		};

		session.onend = function () {
			recognition = null;
			setRecording(false);
		};

		/* start() throws synchronously if the engine refuses the request, which
		   is distinct from the onerror path above. */
		try {
			session.start();
		} catch (error) {
			recognition = null;
			setRecording(false);
			console.warn("[VaaniX] speech recognition start() threw:", error);
			showCardNote(
				micButton,
				"Voice input could not start. Try again in a moment.",
				"start() threw: " + (error && error.name)
			);
			return;
		}
		setRecording(true);
	}

	let speaking = false;

	/* The <audio> element reused for streamed speech, and the queue guard. See
	   playChunks() and stopSpeechEngine(). */
	let player = null;
	let playToken = 0;

	/* The utterance currently being spoken by the browser, so that stopping can
	   detach its handlers first. See stopSpeechEngine(). */
	let currentUtterance = null;

	/* Show or hide the red "recording" look on the mic button. */
	function setRecording(recording) {
		if (!micButton) return;
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
			showCardNote(
				speakButton,
				"The audio for this language could not be loaded. Check your connection and try again.",
				"player.onerror for " + ttsUrl(language, chunks[0]).slice(0, 60)
			);
		};

		player.src = ttsUrl(language, chunks[0]);
		/* Autoplay can still be refused if the page somehow has no user
		   gesture; that rejects rather than throws. Note that the gesture is
		   spent by the time this runs: play() happens after the voices promise
		   in speakTranslation() resolves, which is enough for a browser to
		   treat the play as unprompted. */
		const started = player.play();
		if (started && started.catch) started.catch(function (error) {
			if (token !== playToken) return;
			stopSpeaking();
			/* AbortError is our own stopSpeechEngine() pulling the src out from
			   under the element - reporting that as a failure would scold the
			   reader for pressing stop. */
			const name = error && error.name;
			if (name === "AbortError") return;
			if (name === "NotAllowedError") {
				showCardNote(
					speakButton,
					"Your browser blocked playback. Press Listen again to allow audio.",
					"play() rejected: NotAllowedError"
				);
				return;
			}
			showCardNote(
				speakButton,
				"The audio for this language could not be played. Check your connection and try again.",
				"play() rejected: " + name
			);
		});
	}

	/* Read the current translation aloud using the browser's speech. */
	function speakTranslation() {
		/* .output-empty is the offline-set notice: there is no translation in it
		   to read, and reading the notice aloud would be the app describing its
		   own dataset instead of speaking the user's text. Returning silently
		   used to leave the button looking broken, so it now says why. */
		if (output.querySelector(".output-placeholder, .output-empty")) {
			showCardNote(
				speakButton,
				"Nothing to read yet. Translate something first.",
				"speak clicked with no translation on screen"
			);
			return;
		}
		const text = output.innerText.trim();
		if (!text) {
			showCardNote(
				speakButton,
				"Nothing to read yet. Translate something first.",
				"speak clicked with an empty output area"
			);
			return;
		}

		/* Clicking again while it talks stops it instead of queueing a second
		   read of the same line. */
		if (speaking) {
			stopSpeaking();
			return;
		}

		clearCardNote(speakButton);

		const tag = getSpeechLanguage();
		const language = ttsLanguage(tag);

		speaking = true;
		setSpeaking(true);
		stopSpeechEngine();

		speechVoices().then(function (voices) {
			if (!speaking) return; /* stopped while we waited for the list */

			const voice = pickVoice(voices, tag);
			if (voice && typeof window.SpeechSynthesisUtterance === "function") {
				speakWithBrowser(text, tag, voice);
				return;
			}
			if (voice) {
				/* A voice exists but the constructor does not, which should not
				   happen - fall through to streaming rather than throw. */
				console.warn("[VaaniX] a voice matched but SpeechSynthesisUtterance is missing");
			}

			/* Odia and Assamese have a voice in neither place. Checked here
			   rather than up front so that installing the Windows voice pack
			   later is enough to make Listen work with no code change. */
			if (language === "or" || language === "as") {
				stopSpeaking();
				showCardNote(
					speakButton,
					"No " + (language === "or" ? "Odia" : "Assamese")
						+ " speech voice is installed yet. The translation is on screen; "
						+ "installing that voice pack would make Listen work.",
					"no local voice and no stream fallback for " + tag
				);
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
		currentUtterance = speech;
		speech.lang = tag;
		speech.voice = voice;
		speech.rate = 0.95;
		/* Without these a dropped or failed utterance leaves the button stuck
		   showing that it is speaking. */
		speech.onend = function () {
			currentUtterance = null;
			stopSpeaking();
		};
		speech.onerror = function (event) {
			/* cancel() in stopSpeechEngine() fires this with "interrupted" or
			   "canceled". Those are this app stopping itself, so they must not
			   be reported as a playback failure. */
			const code = event && event.error;
			const wasSpeaking = speaking;
			stopSpeaking();
			if (!wasSpeaking) return;
			if (code === "interrupted" || code === "canceled") return;
			showCardNote(
				speakButton,
				"This browser could not read the translation aloud. Try Listen again.",
				"utterance onerror: " + code
			);
		};
		window.speechSynthesis.speak(speech);
	}

	/* One place that shuts off whichever engine is currently talking, so the
	   two cannot speak over each other. */
	function stopSpeechEngine() {
		playToken++;
		/* Detach the utterance before cancelling. cancel() fires onerror with
		   "interrupted" on whatever is still speaking, and that handler calls
		   stopSpeaking() again - which would cancel once more, forever. */
		if (currentUtterance) {
			currentUtterance.onend = null;
			currentUtterance.onerror = null;
			currentUtterance = null;
		}
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
		if (!speakButton) return;
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