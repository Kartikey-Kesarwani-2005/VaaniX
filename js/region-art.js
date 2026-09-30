/* VAANIX - REGION LANDMARK ART

   Each region shows its landmark two ways, layered so that one is always a
   fallback for the other:

     1. a photo in assets/regions/<region>.jpg, and
     2. a hand-built inline SVG silhouette, which is always present.

   The photo layer is removed again if the image fails to load, so a missing
   or broken file falls back to the silhouette rather than an empty box. The
   SVG is built inline (no request), so a region with no photo still costs
   nothing and still works offline.

   Every piece is drawn in a LOCAL space: centred on x = 0, standing on a
   baseline at y = 90. That lets the same geometry be used twice - scaled up
   for a single region, and scaled down and placed side by side for
   "Standard Hindi", whose silhouette is a composite of all five.

   js/language.js is not touched: this file listens to #region on its own. */

const VAANIX_LANDMARKS = {
	/* --- Agra: the Taj. White marble, so the lightest silhouette. --- */
	agra: `<g>
		<rect x="-52" y="82" width="104" height="8"/>
		<rect x="-32" y="60" width="64" height="22"/>
		<rect x="-24" y="53" width="11" height="7"/>
		<path d="M-24 53 C-28 49 -24 44 -18.5 41 C-13 44 -9 49 -13 53 Z"/>
		<rect x="13" y="53" width="11" height="7"/>
		<path d="M13 53 C9 49 13 44 18.5 41 C24 44 28 49 24 53 Z"/>
		<path d="M-20 60 C-28 49 -21 38 0 25 C21 38 28 49 20 60 Z"/>
		<rect x="-2" y="12" width="4" height="14"/>
		<rect x="-46" y="48" width="7" height="42"/>
		<path d="M-46 48 C-51 43 -47 36 -42.5 32 C-38 36 -34 43 -39 48 Z"/>
		<rect x="-33" y="42" width="7" height="48"/>
		<path d="M-33 42 C-38 37 -34 30 -29.5 26 C-25 30 -21 37 -26 42 Z"/>
		<rect x="26" y="42" width="7" height="48"/>
		<path d="M26 42 C21 37 25 30 29.5 26 C34 30 38 37 33 42 Z"/>
		<rect x="39" y="48" width="7" height="42"/>
		<path d="M39 48 C34 43 38 36 42.5 32 C47 36 51 43 46 48 Z"/>
		<path d="M-9 82 L-9 67 Q0 58 9 67 L9 82 Z" fill-opacity="0.5"/>
	</g>`,

	/* --- Lucknow: Bara Imambara. A wide hall between two minarets. --- */
	lucknow: `<g>
		<rect x="-47" y="86" width="94" height="6"/>
		<rect x="-43" y="47" width="86" height="39"/>
		<rect x="-49" y="42" width="98" height="5"/>
		<path d="M-19 86 L-19 60 Q0 42 19 60 L19 86 Z" fill-opacity="0.5"/>
		<path d="M-38 86 L-38 68 Q-31 59 -24 68 L-24 86 Z" fill-opacity="0.38"/>
		<path d="M24 86 L24 68 Q31 59 38 68 L38 86 Z" fill-opacity="0.38"/>
		<path d="M-34 42 C-39 36 -35 30 -29 26 C-23 30 -19 36 -24 42 Z"/>
		<path d="M24 42 C19 36 23 30 29 26 C35 30 39 36 34 42 Z"/>
		<rect x="-58" y="24" width="8" height="62"/>
		<path d="M-58 24 C-63 18 -59 11 -54 7 C-49 11 -45 18 -50 24 Z"/>
		<rect x="-56.5" y="1" width="3" height="7"/>
		<rect x="50" y="24" width="8" height="62"/>
		<path d="M50 24 C45 18 49 11 54 7 C59 11 63 18 58 24 Z"/>
		<rect x="52.5" y="1" width="3" height="7"/>
	</g>`,

	/* --- Prayagraj: Allahabad Fort. A long bastioned wall on a plinth. --- */
	prayagraj: `<g>
		<rect x="-58" y="80" width="116" height="10"/>
		<rect x="-50" y="58" width="100" height="22"/>
		<rect x="-47" y="44" width="17" height="36" rx="8.5"/>
		<rect x="-8" y="38" width="18" height="42" rx="9"/>
		<rect x="30" y="44" width="17" height="36" rx="8.5"/>
		<rect x="-50" y="55" width="4" height="5"/>
		<rect x="-38" y="55" width="4" height="5"/>
		<rect x="-6" y="52" width="4" height="5"/>
		<rect x="6" y="52" width="4" height="5"/>
		<rect x="34" y="55" width="4" height="5"/>
		<rect x="44" y="55" width="4" height="5"/>
		<path d="M-5 80 L-5 62 Q1 52 7 62 L7 80 Z" fill-opacity="0.5"/>
		<rect x="-1" y="30" width="4" height="9"/>
	</g>`,

	/* --- Varanasi: the ghats. A shikhara over stepped bathing terraces. --- */
	varanasi: `<g>
		<rect x="-56" y="66" width="26" height="24"/>
		<rect x="-46" y="58" width="18" height="32"/>
		<rect x="-30" y="62" width="12" height="28"/>
		<path d="M-18 66 Q-9 42 0 21 Q9 42 18 66 Z"/>
		<ellipse cx="0" cy="19" rx="8" ry="2.6"/>
		<path d="M-4 19 L-3 10 L3 10 L4 19 Z"/>
		<circle cx="0" cy="8" r="2.6"/>
		<rect x="18" y="66" width="14" height="24"/>
		<rect x="32" y="72" width="12" height="18"/>
		<rect x="44" y="77" width="14" height="13"/>
		<rect x="-56" y="90" width="114" height="3"/>
		<path d="M-56 90 L-56 84 L58 84 L58 90 Z" fill-opacity="0.55"/>
		<path d="M14 90 L14 83 L44 83 L44 90 Z" fill-opacity="0.4"/>
		<path d="M34 90 L34 81 L56 81 L56 90 Z" fill-opacity="0.32"/>
		<path d="M-4 66 L-4 60 Q0 55 4 60 L4 66 Z" fill-opacity="0.5"/>
	</g>`,

	/* --- Patna: Gol Ghar. A round colonial clock tower. --- */
	patna: `<g>
		<rect x="-30" y="80" width="60" height="10"/>
		<ellipse cx="0" cy="80" rx="30" ry="5"/>
		<rect x="-17" y="30" width="34" height="50"/>
		<rect x="-21" y="56" width="42" height="5"/>
		<rect x="-21" y="38" width="42" height="5"/>
		<ellipse cx="0" cy="30" rx="17" ry="5.5"/>
		<path d="M-10 26 C-10 18 -5 14 0 14 C5 14 10 18 10 26 Z"/>
		<rect x="-1.5" y="2" width="3" height="13"/>
		<path d="M1.5 3 L13 6 L1.5 9 Z"/>
		<rect x="-9" y="44" width="6" height="9" rx="2" fill-opacity="0.45"/>
		<rect x="3" y="44" width="6" height="9" rx="2" fill-opacity="0.45"/>
		<rect x="-9" y="62" width="6" height="9" rx="2" fill-opacity="0.45"/>
		<rect x="3" y="62" width="6" height="9" rx="2" fill-opacity="0.45"/>
	</g>`
};

/* Silhouettes are all light: the scene is lit from behind, and a dark
   silhouette would disappear into the hills behind it.

   The keys above are region ids, so one name is used everywhere: the <option>
   values in components/region-selector.html, the photo filenames, and the
   [data-region="..."] selectors in css/region-visual.css.

   "standard" is deliberately not a key: it has no single landmark, so its
   silhouette is a composite of all five, drawn in the order below. Its photo
   is its own standard.jpg, so that composite is only ever the fallback, never
   what the user sees. */

/* Order the five landmarks are drawn in for the "Standard Hindi" silhouette. */
const VAANIX_STRIP = ["varanasi", "patna", "lucknow", "agra", "prayagraj"];

function vaanixPhotoUrl(region) {
	return "assets/regions/" + region + ".jpg";
}

/* Builds the inline SVG for one landmark piece. One shared frame, so every
   region is composed identically: each piece is drawn on a baseline at local
   y = 90 and reaches up to about y = 1, i.e. ~89 units tall, so the
   transforms below have to place that span INSIDE the 0..120 viewBox rather
   than just dropping the baseline in it. */
function vaanixArtwork(piece) {
	const wrap = (inner, x, y, scale) =>
		`<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>`;

	let body;
	if (piece === "mix") {
		/* Five landmarks in a row, each shrunk to about a third.
		   y 88 + (90 * 0.34) = 118.6, so the tallest still clears the
		   bottom edge and the spires stay under y = 120. The pieces come
		   from VAANIX_STRIP so the strip and the drawing can never drift
		   apart; the x positions are index-aligned with it. */
		const xs = [40, 100, 160, 222, 284];
		body = VAANIX_STRIP
			.map((region, i) => wrap(VAANIX_LANDMARKS[region], xs[i], 88, 0.34))
			.join("");
	} else {
		/* One landmark, filling the frame.
		   At 1.15 the 89-unit span covers y 13..115 and x 93..227, so the
		   widest piece (the Imambara, 116 units) still fits 320 wide. */
		body = wrap(VAANIX_LANDMARKS[piece], 160, 12, 1.15);
	}

	return `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMax meet" focusable="false">${body}</svg>`;
}

/* Build the photo layer for a region and resolve to true only if the image
   actually loaded. A failure resolves false, which is the signal to leave the
   layer hidden and let the SVG silhouette stand in.

   One photo per region, including "Standard Hindi": it has its own
   assets/regions/standard.jpg, so it no longer borrows a strip of the five.

   The blurred backdrop is a CSS background using the same URL, so the browser
   fetches the file once and serves both layers from cache. */
function vaanixLoadPhoto(layer, region) {
	return new Promise(function (resolve) {
		const url = vaanixPhotoUrl(region);

		/* Blurred fill behind the photo, so a 3:2 image can sit uncropped in a
		   much wider slot without leaving empty bars. */
		const blur = document.createElement("div");
		blur.className = "photo-blur";
		blur.style.backgroundImage = "url(\"" + url + "\")";
		layer.appendChild(blur);

		const scrim = document.createElement("div");
		scrim.className = "photo-scrim";
		layer.appendChild(scrim);

		const fit = document.createElement("div");
		fit.className = "photo-fit";
		layer.appendChild(fit);

		const img = document.createElement("img");
		img.className = "photo-img";
		img.alt = "";
		img.decoding = "async";
		/* No loading="lazy" here on purpose: the layer is still hidden when
		   the src is set (it is only revealed once a load succeeds), and a
		   lazy image inside a display:none container is never fetched - so
		   the layer would wait forever for a load that never happens.
		   Only the selected region's photo is requested, so there is
		   nothing to gain from deferring it anyway. */
		img.addEventListener("load", function () { resolve(true); });
		img.addEventListener("error", function () { resolve(false); });
		img.src = url;
		fit.appendChild(img);
	});
}

function initRegionArt() {
	const select = document.getElementById("region");
	const art = document.getElementById("regionArt");
	const photo = document.getElementById("regionPhoto");
	const visual = document.getElementById("regionVisual");
	if (!select || !art || !visual) return;

	/* Read .matches at the point of use. The MediaQueryList object is live and
	   stays in sync with the preference, which a plain boolean captured at init
	   would not. */
	const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

	let swapTimer = 0;
	/* Guards against a slow image from a previous region resolving after the
	   user has already moved on and painting the wrong photo. */
	let renderToken = 0;

	/* The <select> is the only source of truth: it names the region, and its
	   option values are the keys of VAANIX_LANDMARKS. Only "standard" needs
	   translating, to the "mix" that draws all five side by side. */
	function currentPiece() {
		return select.value === "standard" ? "mix" : select.value;
	}

	function showSilhouette(token) {
		const svg = vaanixArtwork(currentPiece());
		const apply = function () {
			if (token !== renderToken) return;
			art.innerHTML = svg;
			art.style.opacity = "";
		};
		if (motionQuery.matches) { apply(); return; }
		art.style.opacity = "0";
		window.clearTimeout(swapTimer);
		swapTimer = window.setTimeout(apply, 170);
	}

	function render() {
		const token = ++renderToken;

		/* The sky grade shifts immediately and the artwork cross-fades in
		   over it. Gradients cannot be transitioned, so the tint is kept
		   subtle enough that the instant change is not jarring. */
		visual.setAttribute("data-region", select.value);

		/* Always rebuild the silhouette: it is the fallback, so it must be
		   correct even if the photo ends up covering it. */
		showSilhouette(token);

		photo.hidden = true;
		photo.textContent = "";

		vaanixLoadPhoto(photo, select.value).then(function (ok) {
			if (token !== renderToken) return;
			if (!ok) return; /* stays hidden: the silhouette shows through */
			photo.hidden = false;
			if (motionQuery.matches) return;
			/* One frame at 0 so the browser has a start value to fade from. */
			photo.style.opacity = "0";
			requestAnimationFrame(function () { photo.style.opacity = ""; });
		});
	}

	/* Its own listener: js/language.js keeps sole ownership of
	   #intelligenceText, and this only reacts to the same change event. */
	select.addEventListener("change", render);
	render();
}
