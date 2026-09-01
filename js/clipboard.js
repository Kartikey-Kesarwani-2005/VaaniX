/* VAANIX - CLIPBOARD */


function initClipboard() {

    const copyButton =
        document.getElementById("copyBtn");

    const shareButton =
        document.getElementById("shareBtn");

    const output =
        document.getElementById("outputText");


    if (!copyButton || !output) {
        return;
    }


    copyButton.addEventListener(
        "click",
        copyTranslation
    );


    if (shareButton) {

        shareButton.addEventListener(
            "click",
            shareTranslation
        );

    }


    function shareTranslation() {

        /* No translation yet - nothing to share */

        if (output.querySelector(".output-placeholder")) {
            return;
        }

        const text =
            output.innerText.trim();


        if (!text) {
            return;
        }


        /* Native share menu when available */

        if (navigator.share) {

            navigator.share({

                title: "VaaniX Translation",

                text: text

            });

        }

        else {

            alert(
                "Sharing is not supported in this browser."
            );

        }

    }


    async function copyTranslation() {

        /* No translation yet - nothing to copy */

        if (output.querySelector(".output-placeholder")) {
            return;
        }

        const text =
            output.innerText.trim();


        if (!text) {
            return;
        }


        let copied = false;


        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            try {

                await navigator.clipboard.writeText(
                    text
                );

                copied = true;

            }

            catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );

            }

        }


        if (!copied) {

            /* Fallback for file:// or
               insecure contexts */

            const helper =
                document.createElement(
                    "textarea"
                );

            helper.value = text;

            helper.style.position =
                "fixed";

            helper.style.opacity = "0";

            document.body.appendChild(
                helper
            );

            helper.select();

            copied =
                document.execCommand(
                    "copy"
                );

            helper.remove();

        }


        if (copied) {

            const oldText =
                copyButton.textContent;


            copyButton.textContent =
                "✓ Copied";


            copyButton.classList.add(
                "copied"
            );


            setTimeout(
                function() {

                    copyButton.textContent =
                        oldText;

                    copyButton.classList.remove(
                        "copied"
                    );

                },
                1200
            );

        }

    }

}