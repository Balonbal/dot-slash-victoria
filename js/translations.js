const pages = {
	"base": {
		"title": { "en": "./victoria" },
		"header": { "en": "./victoria - helper tools for swimmers", "no": "./victoria - hjelpeverktøy for svømmere" },
		"unfinished": { "en": "(unfinished)", "no": "(uferdig)" },
		"Theme:" : {"no": "Fargetema:" },
		"Language:": {"no": "Språk:" },
		"Usage:": { "no": "Bruk:" },
		"whereToDo": { "en": "where stuff-to-do is any of the following:", "no": "hvor stuff-to-do er hvilken som helst av følgende kommandoer:" },
		"theme_default" : { "en": "Light (default)", "no": "Lys (standard)" },
		"theme_dark": { "en": "Dark (by Pavel)", "no": "Mørkt (av Pavel)" },
		"lang_en": { "en": "English", "no": "Engelsk" },
		"lang_no": { "en": "Norwegian", "no": "Norsk" },

	}, "uni_p": {
		"Meet details": { "no": "Stevnedetaljer" },
		"Confirmation": { "no": "Bekreftelse" },
		"Cancel": { "no": "Avbryt" },
		"Confirm": { "no": "Bekreft" },
		"Meet name": { "no": "Stevnenavn" },
		"Import from XML": { "no": "Importer fra XML-fil" },
		"Import from medley.no": { "no": "Importer fra medley.no" },
		"You have not yet selected a meet": { "no": "Du har ikke valgt et stevne enda" },
		"Club settings": { "no": "Klubbinstillinger" },
		"Selected club:": { "no": "Velg klubb" },
		"Set club name:": { "no": "Legg til klubbnavn" },
		"Add": { "no": "Legg til" },
		"Change name": { "no": "Endre navn" },
		"Participants": { "no": "Deltakere" },
		"Individuals": { "no": "Individuelle Utøvere" },
		"Name": { "no": "Navn" },
		"Year of birth (class)": {"no": "Fødselsår (klasse)" },
		"Sex": { "no": "Kjønn" },
		"Events": { "no": "Øvelser" },
		"Actions": { "no": "Handlinger" },
		"Add more...": { "no": "Legg til flere..." },
		"Teams": { "no": "Lagutøvere" },
		"Class": { "no": "Aldersklasse" },
		"Team name": { "no": "Lagnavn" },
		"Summary": { "no": "Sammendrag" },
		"Make uni_p.txt": { "no": "Lag uni_p.txt" },
		"Will swim?": { "no": "Skal svømme?" },
		"Event id": { "no": "Øvelsesnummer" },
		"Event": { "no": "Øvelse" },
		"Anticipated time": { "no": "Påmeldingstid" },
		"Junior": { "no": "Junior" },
		"Senior": { "no": "Senior" },
		"Male": { "no": "Mann" },
		"Female": { "no": "Kvinne" },
		"Mixed": { "no": "Mixed" },
	}
}

function Translator() {
	let url = window.location.href;	
	this.url = url.substring(0, url.indexOf("dot-slash-victoria") + "dot-slash-victoria".length);
	this.path = url.substring(this.url.length);
	this.page = this.path.substring(this.path.lastIndexOf("/") + 1, this.path.lastIndexOf("."));
	this.pages = pages;

	this.LoadTranslation = function(page, language) {
		console.log("[Translator::LoadTranslation] This operation is not supported yet, as it requires a host for the translation files");
		return false;
		language = language || "en";
		let translation;
		let res = this.url + "/res/";
		res += page;
		if (language != "en") res += "." + language;
		res += ".json";
		console.log("Fetching translation from " + res);
		return fetch(res).then((response) => {
			if (response.code !== 200) {
				if (lang != "en") return this.LoadTranslation(page);
				return false;
			}
			pages[page] = pages[page] || {};
			response.json().then((json) => {
				for (let i in json) {
					pages[page][i][language] = json[i];
				}
				return pages[page];
			});
		});
	}
	this.SetLanguage = function(lang) {
		this.language = lang;	
		for (let p in pages) {
			this.LoadTranslation(p, lang);
		}
		window.localStorage.setItem("language", lang);
		$(".languageText").text(this.getTranslation("lang_" + lang));
	}
	this.addTranslations = function(page, language, translations) {

	}
	this.getTranslation = function(key, page) {
		page = page || this.page;
		if (!this.pages[page]) page = "base";
		const p = this.pages[page];
		if (!p[key]) {
			if (page != "base") return this.getTranslation(key, "base");
			console.log("[Translator::getTranslation] Unable to find key: " + key);
			return false;
		}
		const val = p[key];
		if (!val[this.language]) return val.en;
		return val[this.language];
	}
	this.Translate = function() {
		const nodes = $(".t");
		this.nodes = this.nodes || [];
		const findNode = function (node, nodes) {
			for (let n in nodes) {
				if (nodes[n].el == node) return n;
			}
			return false;
		}
		nodes.text((i, text) => {
			let index = findNode(nodes[i], this.nodes);
			if (index === false) {
				this.nodes.push({ el: nodes[i], key: text});
				index = findNode(nodes[i], this.nodes);
			}
			const trans = this.getTranslation(this.nodes[index].key);	
			return trans !== false ? trans : text;
		});
	}
}

translator = new Translator();
window.addEventListener("load", function() {
	addLanguage("en");
	addLanguage("no");
	let language = window.localStorage.getItem("language");
	translator.SetLanguage(language || "en");
	translator.Translate();
});
