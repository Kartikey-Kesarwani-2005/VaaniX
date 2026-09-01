/* =========================================
   VAANIX - TRANSLATOR
========================================= */


function initTranslator() {

    const input =
        document.getElementById("inputText");

    const output =
        document.getElementById("outputText");

    const translateButton =
        document.getElementById("translateBtn");

    const clearButton =
        document.getElementById("clearBtn");

    const counter =
        document.getElementById("counter");

    const regionalToggle =
        document.getElementById(
            "regionalToggle"
        );


    if (!input || !output) {
        return;
    }


    /* =====================================
       CHARACTER COUNTER
    ===================================== */

    input.addEventListener(
        "input",
        updateCounter
    );


    /* =====================================
       TRANSLATE
    ===================================== */

    if (translateButton) {

        translateButton.addEventListener(
            "click",
            translateText
        );

    }


    /* =====================================
       CLEAR
    ===================================== */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearText
        );

    }


    /* =====================================
       REGIONAL TOGGLE
    ===================================== */

    if (regionalToggle) {

        regionalToggle.addEventListener(
            "change",
            updateRegionalMode
        );

    }


    /* =====================================
       COUNTER
    ===================================== */

    function updateCounter() {

        counter.textContent =
            `${input.value.length} / 1000`;

    }


    /* =====================================
       TRANSLATE
    ===================================== */

    function translateText() {

        const text =
            input.value.trim();


        if (!text) {

            output.innerHTML = `
                <span class="output-placeholder">
                    Please enter something to translate...
                </span>
            `;

            return;
        }


        const from =
            document.getElementById(
                "fromLanguage"
            ).value;


        const to =
            document.getElementById(
                "toLanguage"
            ).value;


        const region =
            document.getElementById(
                "region"
            ).value;


        /* DEMO */

        const result =
            getDemoTranslation(
                text,
                from,
                to,
                region
            );


        output.textContent =
            result;

    }


    /* =====================================
       DEMO TRANSLATION
    ===================================== */

    function getDemoTranslation(
        text,
        from,
        to,
        region
    ) {


        /*
          Ye sirf frontend demonstration hai.
          Real translation ke liye API/backend
          connect kiya jayega.
        */


        if (
            from === "english" &&
            to === "hindi"
        ) {

            if (
                text.toLowerCase()
                === "where are you going?"
            ) {

                if (region === "prayagraj") {

                    return "कहाँ जा रहे हो?";

                }

                if (region === "patna") {

                    return "कहाँ जा रहल बाड़ऽ?";

                }

                return "आप कहाँ जा रहे हैं?";

            }


            if (
                text.toLowerCase()
                === "what are you doing?"
            ) {

                return "आप क्या कर रहे हैं?";

            }

        }


        if (
            from === "hindi" &&
            to === "english"
        ) {

            if (
                text === "आप क्या कर रहे हैं?"
            ) {

                return "What are you doing?";

            }

            if (
                text === "आप कहाँ जा रहे हैं?"
            ) {

                return "Where are you going?";

            }

        }


        return `Demo translation for: ${text}`;

    }


    /* =====================================
       CLEAR TEXT
    ===================================== */

    function clearText() {

        input.value = "";

        output.innerHTML = `
            <span class="output-placeholder">
                Your translation will appear here...
            </span>
        `;

        updateCounter();

    }


    /* =====================================
       REGIONAL MODE
    ===================================== */

    function updateRegionalMode() {

        const intelligence =
            document.getElementById(
                "intelligenceText"
            );


        if (!intelligence) {
            return;
        }


        if (regionalToggle.checked) {

            intelligence.style.opacity = "1";

        }

        else {

            intelligence.style.opacity = "0.45";

        }

    }

}