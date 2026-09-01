/* =========================================
   VAANIX - VOICE
========================================= */


function initVoice() {

    const micButton =
        document.getElementById("micBtn");

    const speakButton =
        document.getElementById("speakBtn");

    const input =
        document.getElementById("inputText");

    const output =
        document.getElementById("outputText");


    /* =====================================
       MICROPHONE
    ===================================== */

    if (micButton) {

        micButton.addEventListener(
            "click",
            startVoiceInput
        );

    }


    /* =====================================
       SPEAKER
    ===================================== */

    if (speakButton) {

        speakButton.addEventListener(
            "click",
            speakTranslation
        );

    }


    /* =====================================
       VOICE INPUT
    ===================================== */

    function startVoiceInput() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            alert(
                "Voice input is not supported in this browser."
            );

            return;
        }


        const recognition =
            new SpeechRecognition();


        recognition.lang =
            getSpeechLanguage();


        recognition.interimResults =
            false;


        recognition.start();


        micButton.textContent =
            "🔴";


        micButton.classList.add(
            "recording"
        );


        recognition.onresult =
            function(event) {

                const transcript =
                    event.results[0][0].transcript;

                input.value =
                    transcript;

                input.dispatchEvent(
                    new Event("input")
                );

            };


        recognition.onerror =
            function() {

                stopRecording();

            };


        recognition.onend =
            function() {

                stopRecording();

            };


        function stopRecording() {

            micButton.textContent =
                "🎙";

            micButton.classList.remove(
                "recording"
            );

        }

    }


    /* =====================================
       TEXT TO SPEECH
    ===================================== */

    function speakTranslation() {

        /* No translation yet - nothing to read aloud */

        if (output.querySelector(".output-placeholder")) {
            return;
        }

        const text =
            output.innerText.trim();


        if (!text) {
            return;
        }


        if (!window.speechSynthesis) {

            alert(
                "Text-to-speech is not supported."
            );

            return;

        }


        window.speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(text);


        speech.lang =
            getSpeechLanguage();


        speech.rate = 0.9;


        window.speechSynthesis.speak(
            speech
        );

    }


    /* =====================================
       GET SPEECH LANGUAGE
    ===================================== */

    function getSpeechLanguage() {

        const toLanguage =
            document.getElementById(
                "toLanguage"
            );


        if (!toLanguage) {
            return "en-US";
        }


        switch (toLanguage.value) {

            case "hindi":
                return "hi-IN";

            case "english":
                return "en-IN";

            default:
                return "hi-IN";

        }

    }

}