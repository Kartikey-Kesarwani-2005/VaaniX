/* VAANIX - LANGUAGE */


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

    const detected =
        document.getElementById(
            "detectedText"
        );


    if (
        !fromLanguage ||
        !toLanguage ||
        !swapButton
    ) {
        return;
    }


    fromLanguage.addEventListener(
        "change",
        updateLanguageInfo
    );


    toLanguage.addEventListener(
        "change",
        updateLanguageInfo
    );


    swapButton.addEventListener(
        "click",
        swapLanguages
    );


    if (region) {

        region.addEventListener(
            "change",
            updateRegion
        );

    }


    updateLanguageInfo();

    updateRegion();


    function updateLanguageInfo() {

        const from =
            fromLanguage.options[
                fromLanguage.selectedIndex
            ].text;


        if (detected) {

            detected.textContent =
                `${from} selected`;

        }

    }


    function swapLanguages() {

        const oldFrom =
            fromLanguage.value;

        fromLanguage.value =
            toLanguage.value;

        toLanguage.value =
            oldFrom;


        updateLanguageInfo();

    }


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