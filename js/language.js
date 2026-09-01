/* =========================================
   VAANIX - LANGUAGE
========================================= */


/* INITIALIZE LANGUAGE SYSTEM */

function initLanguage() {

    const fromLanguage =
        document.getElementById("fromLanguage");

    const toLanguage =
        document.getElementById("toLanguage");

    const swapButton =
        document.getElementById("swapBtn");

    const region =
        document.getElementById("region");

    const selectedRegion =
        document.getElementById("selectedRegion");

    const intelligenceText =
        document.getElementById("intelligenceText");


    if (
        !fromLanguage ||
        !toLanguage ||
        !swapButton
    ) {
        return;
    }


    /* LANGUAGE CHANGE */

    fromLanguage.addEventListener(
        "change",
        updateLanguageInfo
    );


    toLanguage.addEventListener(
        "change",
        updateLanguageInfo
    );


    /* SWAP */

    swapButton.addEventListener(
        "click",
        swapLanguages
    );


    /* REGION CHANGE */

    if (region) {

        region.addEventListener(
            "change",
            updateRegion
        );

    }


    /* INITIAL UPDATE */

    updateLanguageInfo();

    updateRegion();


    /* =====================================
       UPDATE LANGUAGE
    ===================================== */

    function updateLanguageInfo() {

        const from =
            fromLanguage.options[
                fromLanguage.selectedIndex
            ].text;

        const to =
            toLanguage.options[
                toLanguage.selectedIndex
            ].text;


        const detected =
            document.getElementById(
                "detectedText"
            );


        if (detected) {

            detected.textContent =
                `${from} selected`;

        }

    }


    /* =====================================
       SWAP LANGUAGES
    ===================================== */

    function swapLanguages() {

        const oldFrom =
            fromLanguage.value;

        fromLanguage.value =
            toLanguage.value;

        toLanguage.value =
            oldFrom;


        updateLanguageInfo();

    }


    /* =====================================
       UPDATE REGION
    ===================================== */

    function updateRegion() {

        if (!region) {
            return;
        }


        const regionName =
            region.options[
                region.selectedIndex
            ].text;


        if (selectedRegion) {

            selectedRegion.textContent =
                regionName;

        }


        if (intelligenceText) {

            intelligenceText.innerHTML =
                `VaaniX will adapt the translation
                 to <strong>${regionName}</strong>.`;

        }

    }

}