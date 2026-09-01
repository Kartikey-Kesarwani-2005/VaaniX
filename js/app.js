/* VAANIX - APP */


const components = {

    navbar: "components/navbar.html",

    hero: "components/hero.html",

    "language-selector":
        "components/language-selector.html",

    "region-selector":
        "components/region-selector.html",

    translator:
        "components/translator.html",

    intelligence:
        "components/intelligence.html",

    features:
        "components/features.html",

    footer:
        "components/footer.html"

};


async function loadComponent(id, file) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    try {

        const response =
            await fetch(file);

        if (!response.ok) {

            throw new Error(
                `Unable to load ${file}`
            );

        }

        const html =
            await response.text();

        element.innerHTML = html;

    }

    catch (error) {

        console.error(error);

        element.innerHTML = "";

    }

}


async function loadAllComponents() {

    const entries =
        Object.entries(components);

    await Promise.all(

        entries.map(
            ([id, file]) =>
                loadComponent(id, file)
        )

    );

}


async function startVaaniX() {

    await loadAllComponents();


    /* Init only after components load */

    if (typeof initLanguage === "function") {
        initLanguage();
    }

    if (typeof initTranslator === "function") {
        initTranslator();
    }

    if (typeof initVoice === "function") {
        initVoice();
    }

    if (typeof initClipboard === "function") {
        initClipboard();
    }

    if (typeof initTheme === "function") {
        initTheme();
    }

}


startVaaniX();