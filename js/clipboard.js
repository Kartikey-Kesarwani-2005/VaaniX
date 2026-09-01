/* =========================================
   VAANIX - CLIPBOARD
========================================= */


function initClipboard() {

    const copyButton =
        document.getElementById("copyBtn");

    const output =
        document.getElementById("outputText");


    if (!copyButton || !output) {
        return;
    }


    copyButton.addEventListener(
        "click",
        copyTranslation
    );


    async function copyTranslation() {

        const text =
            output.innerText.trim();


        if (!text) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                text
            );


            const oldText =
                copyButton.textContent;


            copyButton.textContent =
                "✓";


            setTimeout(
                function() {

                    copyButton.textContent =
                        oldText;

                },
                1200
            );

        }

        catch (error) {

            console.error(
                "Copy failed:",
                error
            );

        }

    }

}