/* VAANIX - CLIPBOARD */

/* Wire up the copy and share buttons on the output panel. */
function initClipboard() {
	const copyButton = document.getElementById("copyBtn");
	const shareButton = document.getElementById("shareBtn");
	const output = document.getElementById("outputText");

	if (!copyButton || !output) return;

	copyButton.addEventListener("click", copyTranslation);
	if (shareButton) shareButton.addEventListener("click", shareTranslation);

	/* Grab the translation text, or return empty if there is none yet. */
	function getText() {
		if (output.querySelector(".output-placeholder")) return "";
		return output.innerText.trim();
	}

	/* Share the translation using the browser's native share menu. */
	function shareTranslation() {
		const text = getText();
		if (!text) return;
		if (navigator.share) {
			navigator.share({ title: "VaaniX Translation", text: text });
		} else {
			alert("Sharing is not supported in this browser.");
		}
	}

	/* Copy the translation to the clipboard, with a fallback for file://. */
	async function copyTranslation() {
		const text = getText();
		if (!text) return;

		let copied = false;
		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(text);
				copied = true;
			} catch (error) {
				console.error("Copy failed:", error);
			}
		}
		/* Fallback: hidden textarea + execCommand works on insecure pages. */
		if (!copied) {
			const helper = document.createElement("textarea");
			helper.value = text;
			helper.style.position = "fixed";
			helper.style.opacity = "0";
			document.body.appendChild(helper);
			helper.select();
			copied = document.execCommand("copy");
			helper.remove();
		}

		/* Briefly label the button "✓ Copied" when copy succeeds. */
		if (copied) {
			const oldText = copyButton.textContent;
			copyButton.textContent = "✓ Copied";
			copyButton.classList.add("copied");
			setTimeout(function () {
				copyButton.textContent = oldText;
				copyButton.classList.remove("copied");
			}, 1200);
		}
	}
}