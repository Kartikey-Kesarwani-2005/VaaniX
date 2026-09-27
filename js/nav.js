/* VAANIX - SIDEBAR ACTIONS

   Makes the three non-page sidebar items do real work:
     - My Region : scrolls to the regional panels and spotlights them
     - History   : opens a drawer listing this session's translations
     - Settings  : opens the same drawer in settings mode

   Two constraints shape the code here:

   1. js/translator.js is left untouched. Translations are captured with a
      MutationObserver on #outputText instead of by editing translateText(),
      so no existing behaviour can regress.

   2. History is session-only, held in a plain array. Nothing is written to
      localStorage, so it disappears on reload and leaves no trace behind.

   Everything rendered into the drawer is built with textContent, never
   innerHTML, because it echoes back whatever the user typed. */

/* Newest first, capped so a long session cannot grow without bound. */
const vaanixHistory = [];
const VAANIX_HISTORY_LIMIT = 25;

function initSidebar() {
	const nav = document.querySelector(".nav-list");
	if (!nav) return;

	const badge = document.getElementById("historyBadge");
	const drawer = initDrawer();

	/* ---------- My Region ---------- */
	nav.addEventListener("click", function (event) {
		const button = event.target.closest("[data-nav]");
		if (!button || !nav.contains(button)) return;

		const action = button.getAttribute("data-nav");

		if (action === "region") spotlightRegion();
		else if (action === "history") drawer.open("history", button);
		else if (action === "settings") drawer.open("settings", button);
		/* "translator" is the page you are already on, so it does nothing */
	});

	/* ---------- Session history capture ----------
	   translator.js swaps #outputText's children when a translation lands and
	   puts a .output-placeholder or .output-hint span back when it is cleared,
	   so those two classes are how a real result is told apart from the rest. */
	const output = document.getElementById("outputText");
	const input = document.getElementById("inputText");

	if (output) {
		let lastResult = "";

		/* Set while nav.js itself writes to the workspace, so restoring an
		   entry does not immediately log that same entry again. */
		window.vaanixSuppressHistory = false;

		new MutationObserver(function () {
			if (window.vaanixSuppressHistory) return;
			/* Placeholder and "enter some text" states are not translations. */
			if (output.querySelector(".output-placeholder, .output-hint")) return;

			const result = output.textContent.trim();
			if (!result || result === lastResult) return;

			lastResult = result;
			pushHistory({
				source: input ? input.value.trim() : "",
				result: result
			});
		}).observe(output, { childList: true, characterData: true, subtree: true });
	}

	/* ---------- History model ---------- */
	function pushHistory(entry) {
		const from = document.getElementById("fromLanguage");
		const to = document.getElementById("toLanguage");
		const region = document.getElementById("region");

		vaanixHistory.unshift({
			source: entry.source,
			result: entry.result,
			from: from ? from.options[from.selectedIndex].text : "",
			to: to ? to.options[to.selectedIndex].text : "",
			region: region ? region.options[region.selectedIndex].text : "",
			time: new Date()
		});

		if (vaanixHistory.length > VAANIX_HISTORY_LIMIT) vaanixHistory.pop();
		renderBadge();
	}

	function clearHistory() {
		vaanixHistory.length = 0;
		renderBadge();
	}

	function renderBadge() {
		if (!badge) return;
		const count = vaanixHistory.length;
		badge.textContent = String(count);
		badge.hidden = count === 0;
	}

	/* ---------- My Region behaviour ---------- */
	function spotlightRegion() {
		const panels = document.querySelectorAll(".col-region .region-panel");
		if (!panels.length) return;

		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		panels[0].scrollIntoView({
			behavior: reduced ? "auto" : "smooth",
			block: "center"
		});

		panels.forEach(function (panel) {
			/* Remove, force a reflow, re-add: without the reflow a second
			   click re-uses the running animation and nothing pulses. */
			panel.classList.remove("is-spotlighted");
			void panel.offsetWidth;
			panel.classList.add("is-spotlighted");
			window.setTimeout(function () {
				panel.classList.remove("is-spotlighted");
			}, 1800);
		});
	}

	/* ---------- Drawer ---------- */
	function initDrawer() {
		const root = document.getElementById("drawerRoot");
		const overlay = document.getElementById("drawerOverlay");
		const panel = document.getElementById("drawer");
		const closeButton = document.getElementById("drawerClose");
		const clearButton = document.getElementById("drawerClear");
		const title = document.getElementById("drawerTitle");
		const sub = document.getElementById("drawerSub");
		const body = document.getElementById("drawerBody");

		if (!root || !panel || !body) return { open: function () {} };

		let returnFocusTo = null;

		function isOpen() {
			return root.getAttribute("data-open") === "true";
		}

		function open(mode, trigger) {
			/* The trigger is passed in rather than read from activeElement:
			   a programmatic .click() never focuses the button, so relying on
			   activeElement would lose the return target. */
			returnFocusTo = trigger || document.activeElement;
			render(mode);
			root.setAttribute("data-open", "true");
			document.addEventListener("keydown", onKeyDown, true);
			/* Focus the close button, not the first history row, so the panel
			   never scrolls itself on open. */
			if (closeButton) closeButton.focus();
		}

		function close() {
			if (!isOpen()) return;
			root.setAttribute("data-open", "false");
			document.removeEventListener("keydown", onKeyDown, true);
			/* Send focus back where it came from, or nowhere useful. */
			if (returnFocusTo && document.contains(returnFocusTo)) returnFocusTo.focus();
			returnFocusTo = null;
		}

		function onKeyDown(event) {
			if (event.key === "Escape") {
				event.preventDefault();
				close();
				return;
			}
			if (event.key !== "Tab") return;

			/* Keep Tab inside the dialog while it is modal. */
			const focusable = getFocusable(panel);
			if (!focusable.length) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		function getFocusable(scope) {
			return [...scope.querySelectorAll(
				'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
			)].filter(function (el) { return el.offsetParent !== null; });
		}

		function render(mode) {
			if (mode === "settings") renderSettings();
			else renderHistory();
		}

		/* ---------- History view ---------- */
		function renderHistory() {
			title.textContent = "History";
			sub.textContent = vaanixHistory.length
				? vaanixHistory.length + " translation" + (vaanixHistory.length === 1 ? "" : "s") + " · this session only"
				: "This session only";
			clearButton.hidden = vaanixHistory.length === 0;
			body.replaceChildren();

			if (!vaanixHistory.length) {
				body.appendChild(emptyState(
					"◷",
					"Nothing here yet",
					"Every translation you make in this session is listed here. It is kept in memory only, so reloading the page clears it."
				));
				return;
			}

			const list = document.createElement("ul");
			list.className = "history-list";

			vaanixHistory.forEach(function (entry) {
				const item = document.createElement("li");

				const button = document.createElement("button");
				button.type = "button";
				button.className = "history-item";

				if (entry.source) {
					const source = document.createElement("span");
					source.className = "history-source";
					source.textContent = entry.source;
					button.appendChild(source);
				}

				const result = document.createElement("span");
				result.className = "history-result";
				result.textContent = entry.result;
				button.appendChild(result);

				const meta = document.createElement("span");
				meta.className = "history-meta";
				appendMeta(meta, entry.region);
				appendMeta(meta, entry.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
				button.appendChild(meta);

				button.addEventListener("click", function () {
					restore(entry);
					close();
				});

				item.appendChild(button);
				list.appendChild(item);
			});

			body.appendChild(list);
		}

		function appendMeta(parent, text) {
			if (!text) return;
			if (parent.childNodes.length) {
				const sep = document.createElement("span");
				sep.className = "history-sep";
				sep.textContent = "·";
				sep.setAttribute("aria-hidden", "true");
				parent.appendChild(sep);
			}
			const span = document.createElement("span");
			span.textContent = text;
			parent.appendChild(span);
		}

		/* Put a past translation back into the workspace so it can be
		   copied, replayed or edited instead of being read-only history. */
		function restore(entry) {
			window.vaanixSuppressHistory = true;

			if (input && entry.source) {
				input.value = entry.source;
				/* Let js/translator.js's own listener refresh the counter
				   instead of writing to #counter from here. */
				input.dispatchEvent(new Event("input", { bubbles: true }));
			}
			if (output) output.textContent = entry.result;

			window.setTimeout(function () {
				window.vaanixSuppressHistory = false;
			}, 0);
		}

		/* ---------- Settings view ---------- */
		function renderSettings() {
			title.textContent = "Settings";
			sub.textContent = "Appearance and regional mode";
			clearButton.hidden = true;
			body.replaceChildren();

			const themeButton = document.getElementById("themeBtn");
			const regionalToggle = document.getElementById("regionalToggle");

			const appearance = document.createElement("div");
			appearance.className = "settings-group";
			appearance.appendChild(groupLabel("Appearance"));
			appearance.appendChild(switchRow(
				"Light Glass",
				"Switch the whole interface to the light palette.",
				document.body.classList.contains("light-mode"),
				function (on) {
					/* Drive the header button rather than duplicating theme
					   state, so the two can never disagree. */
					const isLight = document.body.classList.contains("light-mode");
					if (on !== isLight && themeButton) themeButton.click();
				}
			));
			/* Keep in step if the header button is used while the panel is open. */
			if (themeButton) {
				new MutationObserver(function () {
					const input2 = appearance.querySelector("input[type=checkbox]");
					if (input2) input2.checked = document.body.classList.contains("light-mode");
				}).observe(document.body, { attributes: true, attributeFilter: ["class"] });
			}
			body.appendChild(appearance);

			const regional = document.createElement("div");
			regional.className = "settings-group";
			regional.appendChild(groupLabel("Translation"));
			regional.appendChild(switchRow(
				"Regional mode",
				"Dim the regional expression card when you prefer plain Hindi.",
				regionalToggle ? regionalToggle.checked : true,
				function (on) {
					if (!regionalToggle || regionalToggle.checked === on) return;
					regionalToggle.checked = on;
					/* js/translator.js listens for this and applies the dim. */
					regionalToggle.dispatchEvent(new Event("change", { bubbles: true }));
				}
			));
			body.appendChild(regional);

			const engine = document.createElement("div");
			engine.className = "settings-group";
			engine.appendChild(groupLabel("Engine"));
			engine.appendChild(staticRow(
				"Translation engine",
				"Running on bundled demo phrases. No translation API is connected, so only the sample sentences return a regional variant."
			));
			body.appendChild(engine);

			const data = document.createElement("div");
			data.className = "settings-group";
			data.appendChild(groupLabel("Data"));

			const clearRow = document.createElement("div");
			clearRow.className = "settings-row";
			const clearText = document.createElement("div");
			clearText.className = "settings-row-text";
			clearText.appendChild(rowTitle("Session history"));
			clearText.appendChild(rowNote(vaanixHistory.length + " stored in memory. Nothing is written to your browser."));
			clearRow.appendChild(clearText);

			const clear = document.createElement("button");
			clear.type = "button";
			clear.className = "ghost-btn";
			clear.textContent = "Clear";
			clear.disabled = vaanixHistory.length === 0;
			clear.addEventListener("click", function () {
				clearHistory();
				clear.disabled = true;
				clearText.replaceChildren(rowTitle("Session history"), rowNote("Cleared. Nothing was stored on disk."));
			});
			clearRow.appendChild(clear);
			data.appendChild(clearRow);
			body.appendChild(data);
		}

		/* ---------- small builders ---------- */
		function groupLabel(text) {
			const el = document.createElement("span");
			el.className = "settings-label";
			el.textContent = text;
			return el;
		}

		function rowTitle(text) {
			const el = document.createElement("span");
			el.className = "settings-row-title";
			el.textContent = text;
			return el;
		}

		function rowNote(text) {
			const el = document.createElement("span");
			el.className = "settings-row-note";
			el.textContent = text;
			return el;
		}

		function staticRow(titleText, noteText) {
			const row = document.createElement("div");
			row.className = "settings-row";
			const text = document.createElement("div");
			text.className = "settings-row-text";
			text.appendChild(rowTitle(titleText));
			text.appendChild(rowNote(noteText));
			row.appendChild(text);
			return row;
		}

		/* Mirrors the .switch markup used by the regional panel, so the
		   existing checked/focus styles apply unchanged. */
		function switchRow(titleText, noteText, checked, onChange) {
			const row = document.createElement("div");
			row.className = "settings-row";

			const text = document.createElement("div");
			text.className = "settings-row-text";
			text.appendChild(rowTitle(titleText));
			text.appendChild(rowNote(noteText));
			row.appendChild(text);

			const label = document.createElement("label");
			label.className = "switch";

			const box = document.createElement("input");
			box.type = "checkbox";
			box.checked = checked;
			box.setAttribute("aria-label", titleText);
			box.addEventListener("change", function () { onChange(box.checked); });

			const slider = document.createElement("span");
			slider.className = "slider";
			slider.setAttribute("aria-hidden", "true");

			label.appendChild(box);
			label.appendChild(slider);
			row.appendChild(label);
			return row;
		}

		function emptyState(glyph, titleText, bodyText) {
			const wrap = document.createElement("div");
			wrap.className = "drawer-empty";

			const g = document.createElement("span");
			g.className = "drawer-empty-glyph";
			g.setAttribute("aria-hidden", "true");
			g.textContent = glyph;
			wrap.appendChild(g);

			const t = document.createElement("p");
			t.className = "drawer-empty-title";
			t.textContent = titleText;
			wrap.appendChild(t);

			const b = document.createElement("p");
			b.className = "drawer-empty-text";
			b.textContent = bodyText;
			wrap.appendChild(b);
			return wrap;
		}

		if (overlay) overlay.addEventListener("click", close);
		if (closeButton) closeButton.addEventListener("click", close);
		if (clearButton) {
			clearButton.addEventListener("click", function () {
				clearHistory();
				renderHistory();
			});
		}

		return { open: open };
	}
}
