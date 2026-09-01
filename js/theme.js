/* =========================================
   VAANIX - THEME
========================================= */


function initTheme() {

    const themeButton =
        document.getElementById("themeBtn");


    if (!themeButton) {
        return;
    }


    themeButton.addEventListener(
        "click",
        toggleTheme
    );


    function toggleTheme() {

        document.body.classList.toggle(
            "light-mode"
        );


        if (
            document.body.classList.contains(
                "light-mode"
            )
        ) {

            themeButton.textContent =
                "☾";

        }

        else {

            themeButton.textContent =
                "☼";

        }

    }

}