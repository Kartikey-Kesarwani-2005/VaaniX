/* VAANIX - APP */

/* Every page section lives in its own HTML file (a "component"). */
const components = {
	navbar: "components/navbar.html",
	sidebar: "components/sidebar.html",
	"language-selector": "components/language-selector.html",
	"region-selector": "components/region-selector.html",
	translator: "components/translator.html",
	intelligence: "components/intelligence.html",
	features: "components/features.html",
	footer: "components/footer.html",
	drawer: "components/drawer.html"
};

/* What each section is called in a sentence. The page never has to say
   "components/translator.html" - that string is for the console. */
const componentLabels = {
	navbar: "the navigation bar",
	sidebar: "the side menu",
	"language-selector": "the language selector",
	"region-selector": "the region selector",
	translator: "the translation workspace",
	intelligence: "the regional panel",
	features: "the features list",
	footer: "the footer",
	drawer: "the history and settings panel"
};

/* Sort a failure into something a person can act on.

   Deliberately coarse: four buckets is enough to say what to do next, and
   anything finer would mean putting a status code or a path on screen, which
   is exactly what this state exists to avoid. fetch() only rejects for
   network-level problems, so a null status is the offline case. */
function classifyFailure(status) {
	if (status === 404) {
		return {
			summary: "This part of the app is missing from the server.",
			hint: "It may not have made it into the last update."
		};
	}
	if (status === 408 || status === 429 || (status && status >= 500)) {
		return {
			summary: "The server had a problem sending this part of the app.",
			hint: "This is usually temporary."
		};
	}
	if (!status) {
		if (navigator.onLine === false) {
			return {
				summary: "You appear to be offline.",
				hint: "Reconnect and try again. Nothing you type here is sent anywhere."
			};
		}
		return {
			summary: "This part of the app could not be reached.",
			hint: "The connection may have dropped."
		};
	}
	return { summary: "This part of the app did not load.", hint: "" };
}

/* Replace a failed container with a panel that explains itself.

   Everything technical - the path, the status, the exception and its stack -
   goes to the console and stays there. */
function showComponentError(id, file, element, error, status) {
	console.error(
		"[VaaniX] component failed to load: " + id,
		{ component: id, file: file, httpStatus: status, online: navigator.onLine },
		error
	);

	const label = componentLabels[id] || "this part of the app";
	const reason = classifyFailure(status);

	const notice = document.createElement("div");
	notice.className = "file-warning component-error";
	/* Announced without stealing focus: several panels can appear at once and
	   yanking focus to the first one would move the reader off the section
	   they were already reading. */
	notice.setAttribute("role", "alert");

	const title = document.createElement("h2");
	title.textContent = "Couldn't load " + label;

	const body = document.createElement("p");
	body.textContent = reason.summary;

	notice.append(title, body);

	if (reason.hint) {
		const hint = document.createElement("p");
		hint.className = "component-error-hint";
		hint.textContent = reason.hint;
		notice.append(hint);
	}

	/* Retrying means reloading rather than re-fetching this one file.

	   Re-fetching in place would leave the section on screen but inert: its
	   init function already ran (and returned early, finding nothing), and
	   running the inits a second time would attach a *second* listener to
	   every control in the components that did load - two handlers on the
	   theme button toggle it twice and appear to do nothing. A reload is the
	   one recovery that wires every section exactly once. */
	const retry = document.createElement("button");
	retry.type = "button";
	retry.className = "component-error-retry";
	retry.textContent = "Try again";
	retry.addEventListener("click", function () {
		window.location.reload();
	});
	notice.append(retry);

	element.replaceChildren(notice);
}

/* Fetch one component file and drop its HTML into the matching <div>.
   Reports what happened instead of blanking the container and hoping. */
async function loadComponent(id, file) {
	const element = document.getElementById(id);
	if (!element) {
		return { id: id, file: file, ok: false, status: null, error: null };
	}

	element.setAttribute("aria-busy", "true");
	let status = null;

	try {
		const response = await fetch(file);
		status = response.status;
		if (!response.ok) {
			const failure = new Error(
				"HTTP " + response.status + " " + response.statusText + " for " + file
			);
			failure.name = "HttpError";
			throw failure;
		}
		element.innerHTML = await response.text();
	} catch (error) {
		element.removeAttribute("aria-busy");
		showComponentError(id, file, element, error, status);
		return { id: id, file: file, ok: false, status: status, error: error };
	}

	element.removeAttribute("aria-busy");
	return { id: id, file: file, ok: true, status: status, error: null };
}

/* Opened straight from disk, every fetch above fails: browsers refuse
   cross-origin reads under the file: scheme, and each catch then blanks its
   container, so the page renders as nothing at all with only a console error
   to explain it.

   This cannot be fixed by trying harder - there is no way to read a sibling
   file from file:// without a browser flag - so the useful thing is to say so
   on the page instead of showing a blank screen. */
function showFileProtocolNotice() {
	const notice = document.createElement("div");
	notice.className = "file-warning";
	notice.setAttribute("role", "alert");

	const title = document.createElement("h1");
	title.textContent = "VaaniX needs a local web server";

	const body = document.createElement("p");
	body.textContent =
		"This copy was opened straight from disk. VaaniX builds its page out of "
		+ "separate HTML files, and browsers block reading those under the file: "
		+ "scheme, which is why nothing is showing.";

	const steps = document.createElement("ol");
	const command = document.createElement("code");
	command.textContent = "python -m http.server 8000";
	const step = document.createElement("li");
	const stepText = document.createElement("span");
	stepText.textContent = "Run this in the VaaniX folder, then open ";
	step.append(stepText, command);
	steps.append(step);

	const alt = document.createElement("li");
	const altText = document.createElement("span");
	altText.textContent = "In VS Code, right-click index.html and choose ";
	const altCode = document.createElement("code");
	altCode.textContent = "Open with Live Server";
	alt.append(altText, altCode);
	steps.append(alt);

	const link = document.createElement("p");
	const anchor = document.createElement("a");
	anchor.href = "http://localhost:8000";
	anchor.textContent = "http://localhost:8000";
	link.append("or go straight to ", anchor, ".");

	notice.append(title, body, steps, link);

	const main = document.querySelector("main") || document.body;
	main.replaceChildren(notice);
}

/* Load every component before starting the app. */
async function loadAllComponents() {
	const results = await Promise.all(
		Object.entries(components).map(([id, file]) => loadComponent(id, file))
	);

	/* One grouped line, so a deploy that took several sections down reads as
	   one event instead of N unrelated errors to reconstruct. The per-component
	   console.error above still carries the stack for each. */
	const failed = results.filter((result) => !result.ok);
	if (failed.length) {
		console.warn(
			"[VaaniX] " + failed.length + " of " + results.length + " components failed to load",
			failed.map((result) => ({
				component: result.id,
				file: result.file,
				httpStatus: result.status
			}))
		);
	}
	return failed;
}

/* Boot the app: load sections first, then run each init function. */
async function startVaaniX() {
	if (location.protocol === "file:") {
		showFileProtocolNotice();
		return;
	}

	await loadAllComponents();

	/* Boot regardless of what failed. Every init here returns early when its
	   markup is absent, so a section that could not load costs only itself -
	   a missing footer should not take the translator down with it. */
	const initFunctions = [
		initLanguage,
		initTranslator,
		initVoice,
		initClipboard,
		initTheme,
		initSidebar,
		initRegionArt
	];
	/* Call whichever init functions exist — skip any that are missing. */
	initFunctions.forEach(function (init) {
		if (typeof init === "function") init();
	});
}

startVaaniX();