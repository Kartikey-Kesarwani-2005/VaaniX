/* VAANIX - APP */

/* Every page section lives in its own HTML file (a "component"). */
const components = {
	navbar: "components/navbar.html",
	hero: "components/hero.html",
	"language-selector": "components/language-selector.html",
	"region-selector": "components/region-selector.html",
	translator: "components/translator.html",
	intelligence: "components/intelligence.html",
	features: "components/features.html",
	footer: "components/footer.html"
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

/* Load every component before starting the app. */
async function loadAllComponents() {
	await Promise.all(
		Object.entries(components).map(([id, file]) => loadComponent(id, file))
	);
}

/* Boot the app: load sections first, then run each init function. */
async function startVaaniX() {
	await loadAllComponents();
	const initFunctions = [
		initLanguage,
		initTranslator,
		initVoice,
		initClipboard,
		initTheme
	];
	/* Call whichever init functions exist — skip any that are missing. */
	initFunctions.forEach(function (init) {
		if (typeof init === "function") init();
	});
}

startVaaniX();