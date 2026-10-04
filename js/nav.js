/* VAANIX - SIDEBAR, DRAWER AND SESSION HISTORY

   Makes the three non-page sidebar items do real work:
     - My Region : scrolls to the regional panels and spotlights them
     - History   : opens a drawer listing this session's translations
     - Settings  : opens the same drawer in settings mode

   The file is deliberately flat. Each function does one small job, and they
   are written in the order they are used:

     1. vaanixEl        - one helper for building elements
     2. session history - the list, plus push / clear / badge
     3. spotlightRegion - the "My Region" behaviour
     4. the drawer      - one panel, two views
     5. initSidebar     - the only function app.js calls

   Two constraints shape the code here:

   1. js/translator.js is left untouched. Translations are captured with a
      MutationObserver on #outputText instead of by editing translateText(),
      so no existing behaviour can regress.

   2. History is session-only, held in a plain array. Nothing is written to
      localStorage, so it disappears on reload and leaves no trace behind.

   Everything rendered into the drawer is built with textContent, never
   innerHTML, because it echoes back whatever the user typed. */

/* ---------- 1. building elements ---------- */

/* Creates an element and sets its class and text in one call. Almost every
   line of the drawer below builds nodes this way, so this keeps that code
   about structure rather than about createElement/appendChild bookkeeping. */
function vaanixEl(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

/* ---------- 2. session history ---------- */

/* Newest first, capped so a long session cannot grow without bound. */
const vaanixHistory = [];
const VAANIX_HISTORY_LIMIT = 25;

/* The visible words of a <select>, or "" if it is not on the page. */
function selectedText(id) {
	const select = document.getElementById(id);
	return select ? select.options[select.selectedIndex].text : "";
}

function pushHistory(entry) {
	vaanixHistory.unshift({
		source: entry.source,
		result: entry.result,
		from: selectedText("fromLanguage"),
		to: selectedText("toLanguage"),
		region: selectedText("region"),
		time: new Date()
	});

	if (vaanixHistory.length > VAANIX_HISTORY_LIMIT) vaanixHistory.pop();
	renderBadge();
}

function clearHistory() {
	vaanixHistory.length = 0;
	renderBadge();
}

/* The little number on the History button. */
function renderBadge() {
	const badge = document.getElementById("historyBadge");
	if (!badge) return;
	badge.textContent = String(vaanixHistory.length);
	badge.hidden = vaanixHistory.length === 0;
}

/* ---------- 3. My Region ---------- */

/* Scrolls the regional panels into view and pulses them, so the button does
   something visible instead of only jumping the page. */
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

/* ---------- 4. the drawer ---------- */

/* One panel serves both History and Settings, so the open/close behaviour,
   the focus trap and the Escape key exist exactly once.

   Returns { open } so the caller can ask for a view without knowing how the
   panel is put together. */
function initDrawer() {
	const root = document.getElementById("drawerRoot");
	const panel = document.getElementById("drawer");
	const body = document.getElementById("drawerBody");
	const title = document.getElementById("drawerTitle");
	const sub = document.getElementById("drawerSub");
	const clearButton = document.getElementById("drawerClear");

	/* The drawer arrives as a component, so all of this is really here. The
	   guard is only so a component that failed to load cannot take the rest
	   of the page down with it. */
	if (!root || !panel || !body || !title || !sub || !clearButton) {
		return { open: function () {} };
	}

	const overlay = document.getElementById("drawerOverlay");
	const closeButton = document.getElementById("drawerClose");

	/* Where focus goes back to when the panel closes. */
	let returnFocusTo = null;

	function isOpen() {
		return root.getAttribute("data-open") === "true";
	}

	function open(mode, trigger) {
		/* The trigger is passed in rather than read from activeElement:
		   a programmatic .click() never focuses the button, so relying on
		   activeElement would lose the return target. */
		returnFocusTo = trigger || document.activeElement;

		if (mode === "settings") renderSettings();
		else renderHistory();

		root.setAttribute("data-open", "true");
		document.addEventListener("keydown", onKeyDown, true);
		/* Focus the close button, not the first row, so the panel never
		   scrolls itself on open. */
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

	/* Escape closes the panel. Tab is kept inside it while it is open, so
	   focus cannot wander onto the page behind. */
	function onKeyDown(event) {
		if (event.key === "Escape") {
			event.preventDefault();
			close();
			return;
		}
		if (event.key !== "Tab") return;

		const focusable = getFocusable();
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

	/* Everything the user can Tab to inside the panel, skipping anything
	   hidden.

	   Visibility is tested with getClientRects() rather than offsetParent:
	   offsetParent is null for EVERY descendant of a position:fixed element,
	   and this panel lives inside one (.drawer-root), so that test filtered out
	   every control and the trap below silently did nothing. getClientRects()
	   still returns nothing for display:none, and works for fixed and inline
	   elements alike. */
	function getFocusable() {
		return [...panel.querySelectorAll(
			'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
		)].filter(function (item) {
			if (item.hidden) return false;
			if (item.getAttribute("aria-hidden") === "true") return false;
			return item.getClientRects().length > 0;
		});
	}

	/* ---------- History view ---------- */

	function renderHistory() {
		const count = vaanixHistory.length;

		title.textContent = "History";
		sub.textContent = count
			? count + " translation" + (count === 1 ? "" : "s") + " · this session only"
			: "This session only";
		clearButton.hidden = count === 0;
		body.replaceChildren();

		if (!count) {
			body.appendChild(emptyState(
				"◷",
				"Nothing here yet",
				"Every translation you make in this session is listed here. It is kept in memory only, so reloading the page clears it."
			));
			return;
		}

		const list = vaanixEl("ul", "history-list");
		vaanixHistory.forEach(function (entry) {
			const item = vaanixEl("li");
			item.appendChild(historyButton(entry));
			list.appendChild(item);
		});
		body.appendChild(list);
	}

	/* One history row. Clicking it puts the translation back into the
	   workspace so it can be copied, replayed or edited instead of being
	   read-only history. */
	function historyButton(entry) {
		const button = vaanixEl("button", "history-item");
		button.type = "button";

		if (entry.source) button.appendChild(vaanixEl("span", "history-source", entry.source));
		button.appendChild(vaanixEl("span", "history-result", entry.result));
		button.appendChild(metaLine(entry.region, entry.time));

		button.addEventListener("click", function () {
			restore(entry);
			close();
		});

		return button;
	}

	/* The "region · time" line under a result. A separator is added only
	   between the parts that are actually there, so a missing region does
	   not leave a dangling dot. */
	function metaLine(region, time) {
		const line = vaanixEl("span", "history-meta");
		const parts = [region, time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })];

		parts.forEach(function (part) {
			if (!part) return;
			if (line.childNodes.length) {
				const separator = vaanixEl("span", "history-sep", "·");
				separator.setAttribute("aria-hidden", "true");
				line.appendChild(separator);
			}
			line.appendChild(vaanixEl("span", null, part));
		});

		return line;
	}

	/* Put a past translation back into the workspace. */
	function restore(entry) {
		const input = document.getElementById("inputText");
		const output = document.getElementById("outputText");

		window.vaanixSuppressHistory = true;

		if (input && entry.source) {
			input.value = entry.source;
			/* Let js/translator.js's own listener refresh the counter instead
			   of writing to #counter from here. */
			input.dispatchEvent(new Event("input", { bubbles: true }));
		}
		if (output) output.textContent = entry.result;

		/* Cleared on the next tick, once the writes above have been
		   delivered to the observer. */
		window.setTimeout(function () {
			window.vaanixSuppressHistory = false;
		}, 0);
	}

	/* ---------- Settings view ---------- */

	/* Four groups, one function each, so this reads as a plain list of what
	   the panel contains. */
	function renderSettings() {
		title.textContent = "Settings";
		sub.textContent = "Appearance and regional mode";
		clearButton.hidden = true;

		body.replaceChildren(
			appearanceGroup(),
			translationGroup(),
			group("Engine", [staticRow(
				"Translation engine",
				"Running on bundled demo phrases. No translation API is connected, so only the sample sentences return a regional variant."
			)]),
			dataGroup()
		);
	}

	/* A titled group of rows. */
	function group(labelText, rows) {
		const wrap = vaanixEl("div", "settings-group");
		wrap.appendChild(vaanixEl("span", "settings-label", labelText));
		rows.forEach(function (row) { wrap.appendChild(row); });
		return wrap;
	}

	/* The left half of a row: a title with a small note under it. The right
	   half differs per row, so the caller adds it. */
	function rowText(titleText, noteText) {
		const wrap = vaanixEl("div", "settings-row-text");
		wrap.appendChild(vaanixEl("span", "settings-row-title", titleText));
		wrap.appendChild(vaanixEl("span", "settings-row-note", noteText));
		return wrap;
	}

	function appearanceGroup() {
		const row = switchRow(
			"Light Glass",
			"Switch the whole interface to the light palette.",
			document.body.classList.contains("light-mode"),
			function (on) {
				/* Drive the header button rather than duplicating theme state,
				   so the two can never disagree. */
				const themeButton = document.getElementById("themeBtn");
				const isLight = document.body.classList.contains("light-mode");
				if (on !== isLight && themeButton) themeButton.click();
			}
		);

		/* Marks the one switch that has to follow the header button, which
		   lives outside the drawer. */
		row.querySelector("input").setAttribute("data-follow-theme", "");

		return group("Appearance", [row]);
	}

	function translationGroup() {
		const regionalToggle = document.getElementById("regionalToggle");

		const row = switchRow(
			"Regional mode",
			"Dim the regional expression card when you prefer plain Hindi.",
			regionalToggle ? regionalToggle.checked : true,
			function (on) {
				if (!regionalToggle || regionalToggle.checked === on) return;
				regionalToggle.checked = on;
				/* js/translator.js listens for this and applies the dim. */
				regionalToggle.dispatchEvent(new Event("change", { bubbles: true }));
			}
		);

		return group("Translation", [row]);
	}

	function dataGroup() {
		const text = rowText(
			"Session history",
			vaanixHistory.length + " stored in memory. Nothing is written to your browser."
		);
		/* Held so the note can be rewritten in place after clearing, rather
		   than rebuilding the row around it. */
		const note = text.querySelector(".settings-row-note");

		const clear = vaanixEl("button", "ghost-btn", "Clear");
		clear.type = "button";
		clear.disabled = vaanixHistory.length === 0;
		clear.addEventListener("click", function () {
			clearHistory();
			clear.disabled = true;
			note.textContent = "Cleared. Nothing was stored on disk.";
		});

		const row = vaanixEl("div", "settings-row");
		row.appendChild(text);
		row.appendChild(clear);

		return group("Data", [row]);
	}

	/* A row that only says something. */
	function staticRow(titleText, noteText) {
		const row = vaanixEl("div", "settings-row");
		row.appendChild(rowText(titleText, noteText));
		return row;
	}

	/* Mirrors the .switch markup used by the regional panel, so the existing
	   checked and focus styles apply unchanged. */
	function switchRow(titleText, noteText, checked, onChange) {
		const row = vaanixEl("div", "settings-row");
		row.appendChild(rowText(titleText, noteText));

		const box = vaanixEl("input");
		box.type = "checkbox";
		box.checked = checked;
		box.setAttribute("aria-label", titleText);
		box.addEventListener("change", function () { onChange(box.checked); });

		const slider = vaanixEl("span", "slider");
		slider.setAttribute("aria-hidden", "true");

		const label = vaanixEl("label", "switch");
		label.appendChild(box);
		label.appendChild(slider);
		row.appendChild(label);

		return row;
	}

	function emptyState(glyph, titleText, bodyText) {
		const wrap = vaanixEl("div", "drawer-empty");

		const mark = vaanixEl("span", "drawer-empty-glyph", glyph);
		mark.setAttribute("aria-hidden", "true");

		wrap.appendChild(mark);
		wrap.appendChild(vaanixEl("p", "drawer-empty-title", titleText));
		wrap.appendChild(vaanixEl("p", "drawer-empty-text", bodyText));
		return wrap;
	}

	/* ---------- drawer wiring ---------- */

	if (overlay) overlay.addEventListener("click", close);
	if (closeButton) closeButton.addEventListener("click", close);

	clearButton.addEventListener("click", function () {
		clearHistory();
		renderHistory();
	});

	/* The header theme button sits outside the drawer, so the Light Glass
	   switch has to follow it. This observer is created ONCE, here.

	   It used to be created inside renderSettings(), which meant one new
	   observer per Settings open, none of them ever disconnected: the count
	   grew every time the panel was opened, and every one of them re-ran on
	   each theme change. */
	new MutationObserver(function () {
		const box = body.querySelector("[data-follow-theme]");
		if (box) box.checked = document.body.classList.contains("light-mode");
	}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

	return { open: open };
}

/* ---------- 5. wiring ---------- */

/* The only function app.js calls. Everything above is reached from here. */
function initSidebar() {
	const nav = document.querySelector(".nav-list");
	if (!nav) return;

	const drawer = initDrawer();

	/* One listener for the whole list rather than one per button: the four
	   buttons are static, and this keeps the mapping in a single place. */
	nav.addEventListener("click", function (event) {
		const button = event.target.closest("[data-nav]");
		if (!button || !nav.contains(button)) return;

		const action = button.getAttribute("data-nav");

		if (action === "region") spotlightRegion();
		else if (action === "history") drawer.open("history", button);
		else if (action === "settings") drawer.open("settings", button);
		/* "translator" is the page you are already on, so it does nothing */
	});

	watchForTranslations();
}

/* Records every translation that lands in the workspace.

   js/translator.js swaps #outputText's children when a translation appears, and
   those classes are how a real result is told apart from the rest: a
   .output-placeholder when it is cleared, and a .output-empty block when the
   phrase is outside the bundled set. A miss is skipped on purpose - history is
   a list of translations the user asked for, and an entry reading "not in the
   offline sample set" is not one. It would also come back out of restore() as
   if it were a result. */
function watchForTranslations() {
	const output = document.getElementById("outputText");
	if (!output) return;

	const input = document.getElementById("inputText");
	let lastResult = "";

	/* Set while nav.js itself writes to the workspace, so restoring a history
	   entry does not immediately log that same entry again. */
	window.vaanixSuppressHistory = false;

	new MutationObserver(function () {
		if (window.vaanixSuppressHistory) return;
		if (output.querySelector(".output-placeholder, .output-empty")) return;

		const result = output.textContent.trim();
		if (!result || result === lastResult) return;

		lastResult = result;
		pushHistory({
			source: input ? input.value.trim() : "",
			result: result
		});
	}).observe(output, { childList: true, characterData: true, subtree: true });
}
