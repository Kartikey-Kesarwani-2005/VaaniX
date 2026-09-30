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

/* Fetch one component file and drop its HTML into the matching <div>. */
async function loadComponent(id, file) {
	const element = document.getElementById(id);
	if (!element) return;
	try {
		const response = await fetch(file);
		if (!response.ok) throw new Error(`Unable to load ${file}`);
		element.innerHTML = await response.text();
	} catch (error) {
		console.error(error);
		element.innerHTML = "";
	}
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
	await Promise.all(
		Object.entries(components).map(([id, file]) => loadComponent(id, file))
	);
}

/* Boot the app: load sections first, then run each init function. */
async function startVaaniX() {
	if (location.protocol === "file:") {
		showFileProtocolNotice();
		return;
	}

	await loadAllComponents();
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