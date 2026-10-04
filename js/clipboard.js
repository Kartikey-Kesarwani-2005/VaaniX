/* VAANIX - CLIPBOARD */

/* Wire up the copy and share buttons on the output panel.

   Every outcome these two buttons can reach - nothing to copy, a refused
   clipboard, a browser with no share sheet, a share the user cancelled, a share
   that failed - is reported in place: on the card that owns the button, in the
   button's own label, or through a polite live region. Nothing here uses
   alert(). An alert is modal, unstyled, and cannot say which of the two buttons
   is at fault; it also throws away whatever the reader was doing. The console
   still receives the raw error name and stack.

   Feedback is deliberately transient. Both buttons return to their resting
   labels on a timer, so a stale "Copied" can never be left claiming something
   that is no longer true. */

/* ---------- shared message helpers ----------

   js/voice.js owns showCardNote()/clearCardNote() and loads first (see the
   script order in index.html), so the copy card reports through exactly the
   same surface as the mic and speaker cards: the .action-desc already sitting
   in that card. Reusing it keeps one resting-label memory per card instead of
   a second, subtly different one, and keeps "why did nothing happen" in the
   same place for all three action buttons.

   If voice.js ever fails to parse, these local equivalents keep copy and share
   working on their own rather than throwing on a missing global. */
const hasCardNotes = typeof showCardNote === "function" && typeof clearCardNote === "function";

/* Fallbacks. Same .action-desc + data-tone contract, kept minimal on purpose. */
const localCardNotes = new WeakMap();
function localNoteSlot(button) {
	const card = button && button.closest(".action-card");
	const desc = card && card.querySelector(".action-desc");
	if (!desc) return null;
	if (!localCardNotes.has(desc)) {
		localCardNotes.set(desc, desc.textContent);
		if (!desc.id) desc.id = "note-" + (button.id || "action");
	}
	return desc;
}

/* ---------- one live region for both buttons ---------- */

/* The visible feedback is a swap on a card description or a button label. A
   screen reader does not reliably announce either mid-interaction, so the same
   words are also pushed through a polite status region. Created by JS rather
   than added to the markup so it exists only when these buttons do. */
let clipboardStatus = null;

function announce(message) {
	if (!clipboardStatus || !message) return;
	/* Clearing first forces a repeat of the same message to be read again;
	   assigning an identical string is otherwise treated as no change. */
	clipboardStatus.textContent = "";
	clipboardStatus.textContent = message;
}

function getLiveRegion(output) {
	if (clipboardStatus && clipboardStatus.isConnected) return clipboardStatus;
	const region = document.createElement("div");
	region.className = "clipboard-status";
	region.setAttribute("role", "status");
	region.setAttribute("aria-live", "polite");
	/* Sits at the end of the output card: inside the region it describes, and
	   outside the tab order so it cannot be landed on by keyboard. */
	output.closest(".translation-card").appendChild(region);
	clipboardStatus = region;
	return region;
}

/* ---------- copy ---------- */

function initClipboard() {
	const copyButton = document.getElementById("copyBtn");
	const shareButton = document.getElementById("shareBtn");
	const output = document.getElementById("outputText");

	if (!copyButton || !output) return;

	/* One timer, and a sequence number, because a second click during the
	   first one's flash must not be undone by the first timer firing. */
	let copyTimer = null;
	let copySeq = 0;

	copyButton.addEventListener("click", copyTranslation);

	/* Share is optional - the button is not in every build of the panel - so it
	   is wired separately rather than gating the whole init on it. */
	if (shareButton) {
		shareButton.addEventListener("click", shareTranslation);
		markShareAvailability();
	}

	function showCopyNote(message, tone) {
		if (hasCardNotes) {
			/* voice.js shows failures as tone "error". Passing an explicit tone
			   is what lets this file also show a neutral "nothing yet" hint and a
			   positive "Copied" through the same slot. */
			showCardNote(copyButton, message, undefined, tone);
		} else {
			const desc = localNoteSlot(copyButton);
			if (!desc) return;
			desc.textContent = message;
			desc.setAttribute("data-tone", tone);
			copyButton.setAttribute("aria-describedby", desc.id);
		}
	}

	function clearCopyNote() {
		if (hasCardNotes) clearCardNote(copyButton);
		else {
			const desc = localNoteSlot(copyButton);
			if (desc) {
				desc.textContent = localCardNotes.get(desc);
				desc.removeAttribute("data-tone");
			}
			copyButton.removeAttribute("aria-describedby");
		}
	}

	/* The translation to copy, or empty if there is not one.

	   Two states are not a translation and must not be copied: the boot and
	   cleared placeholder, and the .output-empty notice js/translator.js draws
	   when the phrase is outside the bundled set. Copying that one hands the
	   user a paragraph about the offline dataset and calls it a translation.

	   An empty input is no longer one of them - that is reported by #inputNote
	   under the field and leaves the last translation on screen. */
	function getText() {
		if (output.querySelector(".output-placeholder, .output-empty")) return "";
		return output.innerText.trim();
	}

	async function copyTranslation() {
		const text = getText();
		const mine = ++copySeq;

		/* Any flash still running belongs to an earlier click. */
		if (copyTimer) {
			clearTimeout(copyTimer);
			copyTimer = null;
		}
		clearCopyNote();

		if (!text) {
			/* Not an error: there is simply nothing on screen yet. */
			showCopyNote("Nothing to copy yet.", "hint");
			announce("There is no translation to copy yet.");
			return;
		}

		const ok = await writeToClipboard(text);

		/* A newer click started while this one was awaiting the clipboard. Its
		   result is the one on screen, so this one must keep its hands off it. */
		if (mine !== copySeq) return;

		if (ok) flashCopied();
		else {
			showCopyNote("Could not copy. Your browser blocked it.", "error");
			announce("Copy failed. Your browser blocked clipboard access.");
		}
	}

	/* navigator.clipboard first, then the execCommand fallback that still works
	   on an insecure page (file:// has no secure context, which is exactly when
	   the async clipboard API is unavailable). Returns a boolean rather than
	   throwing: both failure modes are ordinary outcomes here, not exceptions
	   worth unwinding through. */
	async function writeToClipboard(text) {
		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch (error) {
				console.warn("[VaaniX] clipboard.writeText failed:", error);
			}
		}
		return legacyCopy(text);
	}

	/* Hidden textarea + execCommand. Kept because it is the only path that
	   works from file://, which is how the project is often opened.

	   Two things the obvious version gets wrong: helper.select() throws focus
	   onto the textarea, so removing it drops a keyboard user back to the top
	   of the document; and a throw from execCommand would skip remove() and
	   leave a stray full-width textarea parked over the page. Hence the
	   try/finally and the explicit focus restore. */
	function legacyCopy(text) {
		const active = document.activeElement;
		const helper = document.createElement("textarea");
		helper.value = text;
		helper.setAttribute("readonly", "");
		helper.setAttribute("aria-hidden", "true");
		helper.tabIndex = -1;
		helper.style.position = "fixed";
		helper.style.top = "0";
		helper.style.left = "-9999px";
		helper.style.opacity = "0";
		document.body.appendChild(helper);
		try {
			helper.select();
			helper.setSelectionRange(0, helper.value.length);
			return document.execCommand("copy");
		} catch (error) {
			console.warn("[VaaniX] execCommand copy failed:", error);
			return false;
		} finally {
			helper.remove();
			/* Put the keyboard back where it was. preventScroll because the
			   helper was parked at the top-left and focusing without it can
			   jump the viewport. */
			if (active && typeof active.focus === "function") {
				active.focus({ preventScroll: true });
			}
		}
	}

	/* The success flash. Two things mark it: the existing .copied class, which
	   tints the card border and adds a tick after the title, and a short
	   "Copied" in the card description where the failure messages also appear,
	   so a sighted user learns the outcome without hunting.

	   copyBtn.textContent is deliberately left alone. The button is childless by
	   design, so that text IS the icon - and .action-hit renders it at
	   font-size:0 anyway, making a text swap both destructive and invisible. */
	function flashCopied() {
		copyButton.classList.add("copied");
		showCopyNote("Copied", "success");
		announce("Translation copied to the clipboard.");
		copyTimer = setTimeout(function () {
			copyTimer = null;
			copyButton.classList.remove("copied");
			clearCopyNote();
		}, 1600);
	}

	/* ---------- share ---------- */

	/* navigator.share is the whole feature, so when it is missing the button is
	   known-broken before anyone presses it. It stays focusable and clickable
	   on purpose: aria-disabled rather than disabled, so a screen-reader user
	   can reach the control that explains the limitation instead of finding a
	   dead control with no explanation. */
	function markShareAvailability() {
		if (navigator.share) return;
		shareButton.setAttribute("aria-disabled", "true");
		shareButton.classList.add("is-unavailable");
		shareButton.title = "Sharing is not available in this browser";
	}

	let shareTimer = null;
	let shareSeq = 0;

	async function shareTranslation() {
		const text = getText();
		const mine = ++shareSeq;

		if (shareTimer) {
			clearTimeout(shareTimer);
			shareTimer = null;
		}
		shareButton.removeAttribute("data-state");

		if (!text) {
			setShareLabel("Nothing yet");
			shareButton.title = "There is no translation to share yet";
			announce("There is no translation to share yet.");
			return;
		}

		if (!navigator.share) {
			setShareLabel("Unavailable");
			shareButton.title = "Sharing is not available in this browser";
			announce("Sharing is not available in this browser.");
			return;
		}

		setShareLabel("Sharing…");
		shareButton.title = "Opening the share menu";

		let payload;
		try {
			payload = { title: "VaaniX Translation", text: text };
			/* canShare is a separate capability from share existing, and it is
			   the one that rejects a payload the platform will not take. */
			if (navigator.canShare && !navigator.canShare(payload)) {
				throw new Error("payload rejected by canShare()");
			}
			/* Called without awaiting anything beforehand: share() requires the
			   user gesture to still be active, so this has to be the first await
			   boundary crossed from the click. */
			await navigator.share(payload);
		} catch (error) {
			if (mine !== shareSeq) return;

			/* AbortError is the user closing the sheet. That is a decision, not a
			   fault: it gets no error styling and no message, because telling
			   someone "sharing failed" after they chose to cancel is noise. */
			if (error && error.name === "AbortError") {
				resetShareLabel();
				return;
			}

			console.warn("[VaaniX] share failed:", error);
			setShareLabel("Failed");
			shareButton.dataset.state = "error";
			shareButton.title = "Sharing failed in this browser";
			announce("Sharing failed. Your browser could not open the share menu.");
			shareTimer = setTimeout(function () {
				shareTimer = null;
				resetShareLabel();
			}, 2400);
			return;
		}

		if (mine !== shareSeq) return;

		setShareLabel("Shared");
		shareButton.dataset.state = "done";
		shareButton.title = "Shared";
		announce("Translation shared.");
		shareTimer = setTimeout(function () {
			shareTimer = null;
			resetShareLabel();
		}, 1600);
	}

	/* Only the label span is rewritten. The button's other child is the arrow
	   glyph, and a textContent swap on the button would remove it. */
	function setShareLabel(text) {
		const label = shareButton.querySelector(".ghost-btn-label");
		if (label) label.textContent = text;
		/* Without the span (an older build of the panel) the state still shows
		   through data-state and the title. */
	}

	function resetShareLabel() {
		setShareLabel("Share");
		shareButton.removeAttribute("data-state");
		shareButton.title = "Share translation";
	}

	/* Built here rather than on first use so the first copy already announces. */
	getLiveRegion(output);
}
