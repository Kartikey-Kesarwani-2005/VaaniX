/* VAANIX - THEME */

/* Two themes, one class on <body>: "light-mode" is always defined in
   css/base.css, so switching is just a classList toggle. */
function initTheme() {
	const themeButton = document.getElementById("themeBtn");
	if (!themeButton) return;

	themeButton.addEventListener("click", toggleTheme);

	function toggleTheme() {
		const light = document.body.classList.toggle("light-mode");
		/* The glyph says what clicking will do, not what is active, and the
		   title has to follow it or the tooltip lies after the first click. */
		themeButton.textContent = light ? "☾" : "☼";
		themeButton.title = light ? "Switch to dark theme" : "Switch to light theme";
	}
}
