/* VAANIX - TRANSLATOR */


function initTranslator() {

    const input =
        document.getElementById("inputText");

    const output =
        document.getElementById("outputText");

    const translateButton =
        document.getElementById("translateBtn");

    const translateLabel =
        document.getElementById("translateLabel");

    const clearButton =
        document.getElementById("clearBtn");

    const counter =
        document.getElementById("counter");

    const regionalToggle =
        document.getElementById(
            "regionalToggle"
        );

    const fromLanguage =
        document.getElementById(
            "fromLanguage"
        );

    const toLanguage =
        document.getElementById(
            "toLanguage"
        );

    const region =
        document.getElementById(
            "region"
        );

    const intelligence =
        document.getElementById(
            "intelligenceText"
        );


    if (!input || !output) {
        return;
    }


    input.addEventListener(
        "input",
        updateCounter
    );


    if (translateButton) {

        translateButton.addEventListener(
            "click",
            translateText
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearText
        );

    }


    if (regionalToggle) {

        regionalToggle.addEventListener(
            "change",
            updateRegionalMode
        );

    }


    function updateCounter() {

        counter.textContent =
            `${input.value.length} / 1000`;

    }


    function translateText() {

        const text =
            input.value.trim();


        if (!text) {

            output.innerHTML = `
                <span class="output-hint">
                    Please enter some text to
                    translate first.
                </span>
            `;

            input.focus();

            return;
        }


        const from =
            fromLanguage.value;

        const to =
            toLanguage.value;

        const regionValue =
            region.value;


        const result =
            getDemoTranslation(
                text,
                from,
                to,
                regionValue
            );


        /* SHOW LOADING STATE */

        if (translateLabel) {
            translateLabel.textContent =
                "Translating...";
        }


        setTimeout(function () {

            output.textContent =
                result;

            if (translateLabel) {
                translateLabel.textContent =
                    "Translate with VaaniX";
            }

        }, 400);

    }


    function getDemoTranslation(
        text,
        from,
        to,
        region
    ) {


        /* Demo only - real translation needs an API later. */


        if (
            from === "english" &&
            to === "hindi"
        ) {

            const lower =
                text.toLowerCase();


            /* WHERE ARE YOU GOING? */

            if (
                lower === "where are you going?"
            ) {

                if (region === "prayagraj") {

                    return "कहाँ जा रहे हो?";

                }

                if (region === "patna") {

                    return "कहाँ जा रहल बाड़ऽ?";

                }

                if (region === "lucknow") {

                    return "तू कहाँ जात है?";

                }

                return "आप कहाँ जा रहे हैं?";

            }


            /* WHAT ARE YOU DOING? */

            if (
                lower === "what are you doing?"
            ) {

                if (region === "prayagraj") {

                    return "का कर रहे हो?";

                }

                if (region === "patna") {

                    return "का करत बाड़ऽ?";

                }

                if (region === "lucknow") {

                    return "का करत हौ?";

                }

                return "आप क्या कर रहे हैं?";

            }


            /* HOW ARE YOU? */

            if (
                lower === "how are you?"
            ) {

                if (region === "prayagraj") {

                    return "कैसे हो?";

                }

                if (region === "patna") {

                    return "कैसन बाड़ऽ?";

                }

                if (region === "lucknow") {

                    return "कैसन हौ?";

                }

                return "आप कैसे हैं?";

            }

        }


        if (
            from === "hindi" &&
            to === "english"
        ) {

            const going =
                text === "आप कहाँ जा रहे हैं?" ||
                text === "कहाँ जा रहे हो?" ||
                text === "कहाँ जा रहल बाड़ऽ?" ||
                text === "तू कहाँ जात है?";


            const doing =
                text === "आप क्या कर रहे हैं?" ||
                text === "का कर रहे हो?" ||
                text === "का करत बाड़ऽ?" ||
                text === "का करत हौ?";


            const how =
                text === "आप कैसे हैं?" ||
                text === "कैसे हो?" ||
                text === "कैसन बाड़ऽ?" ||
                text === "कैसन हौ?";


            if (going) {

                return "Where are you going?";

            }

            if (doing) {

                return "What are you doing?";

            }

            if (how) {

                return "How are you?";

            }

        }


        return `Demo translation for: ${text}`;

    }


    function clearText() {

        input.value = "";

        output.innerHTML = `
            <span class="output-placeholder">
                Your translation will appear here...
            </span>
        `;

        updateCounter();

    }


    function updateRegionalMode() {

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