/* VAANIX - LANGUAGE CATALOGUE AND PHRASE DATA

   Two flat tables, kept out of js/translator.js so that adding a language is a
   data change and nothing in the logic has to be touched.

   VAANIX_LANGUAGES is the one list the FROM/TO dropdowns are built from, and
   it is Indian languages only for now: the eight scheduled languages plus
   Odia and Assamese, with English kept because it is the source language the
   whole app translates FROM.

   The five regional dialects (Bhojpuri, Maithili, Magahi, Awadhi, Braj) are
   deliberately not in it. They are covered by the region picker, which is where
   they belong - a dialect is a flavour of Hindi, not a separate language, and
   putting it in the upper bar would make the FROM/TO pair mean two different
   things. See region-selector.html.

   Urdu is also absent, and that is a temporary omission rather than a judgement:
   it is Arabic script and RTL, and the layout here (selects, output area, the
   intelligence drawer) all assume left-to-right. It should be added together
   with real RTL support, not on its own.

   `bcp` is the BCP-47 tag js/voice.js hands to the Web Speech API, so speech
   input and text-to-speech follow the dropdown instead of guessing.

   VAANIX_PHRASES is the bundled demo dictionary. Every phrase carries a text
   field per language, plus an optional `regions` map of regional Hindi
   variants. `regions` is consulted only when Regional mode is on AND the
   target language is Hindi - see getDemoTranslation() in js/translator.js.

   A phrase with no regional variant is a normal Standard Hindi translation,
   which is what the regional path falls back to. That is why the map can stay
   small: only the phrases with a real local flavour need one. */

const VAANIX_LANGUAGES = [
	{ code: "english", label: "English", native: "English", bcp: "en-IN", flag: "🇬🇧" },
	{ code: "hindi", label: "Hindi", native: "हिन्दी", bcp: "hi-IN", flag: "🇮🇳" },
	{ code: "bengali", label: "Bengali", native: "বাংলা", bcp: "bn-IN", flag: "🇮🇳" },
	{ code: "punjabi", label: "Punjabi", native: "ਪੰਜਾਬੀ", bcp: "pa-IN", flag: "🇮🇳" },
	{ code: "marathi", label: "Marathi", native: "मराठी", bcp: "mr-IN", flag: "🇮🇳" },
	{ code: "gujarati", label: "Gujarati", native: "ગુજરાતી", bcp: "gu-IN", flag: "🇮🇳" },
	{ code: "tamil", label: "Tamil", native: "தமிழ்", bcp: "ta-IN", flag: "🇮🇳" },
	{ code: "telugu", label: "Telugu", native: "తెలుగు", bcp: "te-IN", flag: "🇮🇳" },
	{ code: "kannada", label: "Kannada", native: "ಕನ್ನಡ", bcp: "kn-IN", flag: "🇮🇳" },
	{ code: "malayalam", label: "Malayalam", native: "മലയാളം", bcp: "ml-IN", flag: "🇮🇳" },
	{ code: "odia", label: "Odia", native: "ଓଡ଼ିଆ", bcp: "or-IN", flag: "🇮🇳" },
	{ code: "assamese", label: "Assamese", native: "অসমীয়া", bcp: "as-IN", flag: "🇮🇳" }
];

/* The one source of truth for which language a phrase must carry. Checked by
   the phrase table below, so a language added to the catalogue and forgotten
   in a phrase is caught immediately instead of showing up as an undefined. */
const VAANIX_PHRASE_LANGUAGES = [
	"english", "hindi", "bengali", "punjabi", "marathi", "gujarati",
	"tamil", "telugu", "kannada", "malayalam", "odia", "assamese"
];

/* Everyday English -> Indian languages, plus regional Hindi flavours.
   `regions` holds only the variants that genuinely differ; a region missing
   from the map falls back to the Standard Hindi in the same object. */
const VAANIX_PHRASES = [
	{
		english: "Where are you going?",
		hindi: "आप कहाँ जा रहे हैं?",
		bengali: "আপনি কোনদিকে যাচ্ছেন?",
		punjabi: "ਤੁਸੀਂ ਕਿੱਥੇ ਜਾ ਰਹੇ ਹੋ?",
		marathi: "तुम्ही कुठे जात आहात?",
		gujarati: "તમે ક્યાં જઈ રહ્યા છો?",
		tamil: "நீங்கள் எங்கே செல்கிறீர்கள்?",
		telugu: "మీరు ఎక్కడికి వెళుతున్నారు?",
		kannada: "ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?",
		malayalam: "നീ എവിടേക്കാണ് പോകുന്നത്?",
		odia: "ଆପଣ କେଉଁକୁ ଯାଉଛନ୍ତି?",
		assamese: "আপুনি ক'তালৈ যাব?",
		regions: {
			patna: "कहाँ जा रहल बाड़ऽ?",
			prayagraj: "कहाँ चले भइल?",
			varanasi: "कहाँ जात बाई?"
		}
	},
	{
		english: "What are you doing?",
		hindi: "आप क्या कर रहे हैं?",
		bengali: "আপনি কী করছেন?",
		punjabi: "ਤੁਸੀਂ ਕੀ ਕਰ ਰਹੇ ਹੋ?",
		marathi: "तुम्ही काय करत आहात?",
		gujarati: "તમે શું કરી રહ્યા છો?",
		tamil: "நீங்கள் என்ன செய்கிறீர்கள்?",
		telugu: "మీరు ఏమి చేస్తున్నారు?",
		kannada: "ನೀವು ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ?",
		malayalam: "നീ എന്താണ് ചെയ്യുന്നത്?",
		odia: "ଆପଣ କ'ଣ କରୁଛନ୍ତି?",
		assamese: "আপুনি কি কৰিছে?"
	},
	{
		english: "How are you?",
		hindi: "आप कैसे हैं?",
		bengali: "আপনি কেমন আছেন?",
		punjabi: "ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?",
		marathi: "तुम्ही कसे आहात?",
		gujarati: "તમે કેમ છો?",
		tamil: "நீங்கள் எப்படி இருக்கிறீர்கள்?",
		telugu: "మీరు ఎలా ఉన్నారు?",
		kannada: "ನೀವು ಹೇಗಿದ್ದೀರಿ?",
		malayalam: "നീ എങ്ങനെയുണ്ട്?",
		odia: "ଆପଣ କେମି ଅଛନ୍ତି?",
		assamese: "আপুনি কেনেকৈ আছে?",
		regions: {
			patna: "कैसन बाड़ऽ?"
		}
	},
	{
		english: "Thank you very much",
		hindi: "बहुत-बहुत धन्यवाद",
		bengali: "অনেক অনেক ধন্যবাদ",
		punjabi: "ਬਹੁਤ-ਬਹੁਤ ਧੰਨਵਾਦ",
		marathi: "खूप खूप आभारी आहे",
		gujarati: "ખૂબ ખૂબ આભાર",
		tamil: "மிக்க மிக்க நன்றி",
		telugu: "ధన్యవాదాలు చాలా చాలా",
		kannada: "ತುಂಬಾ ತುಂಬಾ ಧನ್ಯವಾದಗಳು",
		malayalam: "വളരെ വളരെ നന്ദി",
		odia: "ବହୁତ ବହୁତ ଧନ୍ୟବାଦ",
		assamese: "বহুত বহুত ধন্যবাদ"
	},
	{
		english: "See you tomorrow",
		hindi: "कल मिलेंगे",
		bengali: "আগামীকাল দেখা হবে",
		punjabi: "ਕੱਲ੍ਹ ਮਿਲਾਂਗੇ",
		marathi: "उद्या भेटू",
		gujarati: "કાલે મળીશું",
		tamil: "நாளைக்கு பார்க்கலாம்",
		telugu: "రేపు కలుద్దాం",
		kannada: "ನಾಳೆ ಭೇಟಿಯಾಗುತ್ತೇವೆ",
		malayalam: "നാളെ കാണാം",
		odia: "ଆସନ୍ତାମାନ ଦେଖିବା",
		assamese: "আজিৰে দেখা হ'ব"
	}
];

/* ---------- lookup helpers ---------- */

/* "<language>|<normalised text>" -> the phrase object. Built on first use
   rather than at load, so a page that never translates pays nothing for it.

   The phrase is stored rather than the finished string, because the regional
   variant is a property OF the phrase - a flattened "english|hindi|..." index
   has no way to answer "and what does Patna say about this one?", which is
   exactly the question the Regional mode toggle asks. */
let vaanixPhraseIndex = null;

function vaanixPhraseLookup() {
	if (vaanixPhraseIndex) return vaanixPhraseIndex;

	vaanixPhraseIndex = new Map();

	VAANIX_PHRASES.forEach(function (phrase) {
		VAANIX_PHRASE_LANGUAGES.forEach(function (code) {
			const source = phrase[code];
			/* A phrase missing one language is still usable for the languages
			   it does have, so that pair is skipped rather than registering a
			   key that points at an undefined field. */
			if (!source) return;
			/* First one wins, so a later phrase cannot shadow an earlier one. */
			const key = code + "|" + normalisePhrase(source);
			if (!vaanixPhraseIndex.has(key)) vaanixPhraseIndex.set(key, phrase);
		});

		/* A regional variant is also a way to say the phrase, so it is indexed
		   under Hindi too. That is what lets a user paste "कहाँ जा रहल बाड़ऽ?"
		   and get a real answer instead of a miss. */
		if (!phrase.regions) return;
		Object.keys(phrase.regions).forEach(function (regionKey) {
			const variant = phrase.regions[regionKey];
			const key = "hindi|" + normalisePhrase(variant);
			if (!vaanixPhraseIndex.has(key)) vaanixPhraseIndex.set(key, phrase);
		});
	});

	return vaanixPhraseIndex;
}

/* The phrase said in `from` language, or null. */
function vaanixFindPhrase(from, text) {
	if (typeof normalisePhrase !== "function") return null;
	const key = from + "|" + normalisePhrase(text);
	return vaanixPhraseLookup().get(key) || null;
}

/* Case-, spacing- and punctuation-insensitive key, so "How are you?",
   "how are you" and "  How  are you ?  " all find the same entry. */
function normalisePhrase(text) {
	return String(text)
		.toLowerCase()
		.replace(/[.!?।,]+$/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/* The catalogue entry for a language code, or null. */
function vaanixLanguage(code) {
	if (typeof VAANIX_LANGUAGES === "undefined") return null;
	return VAANIX_LANGUAGES.find(function (language) { return language.code === code; }) || null;
}

/* "Hindi", or the code itself if the catalogue does not know it. */
function vaanixLanguageLabel(code) {
	const language = vaanixLanguage(code);
	return language ? language.label : code;
}
