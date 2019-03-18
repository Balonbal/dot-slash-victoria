const pages = {
	"base": {
		"title": { "en": "./victoria" },
		"header": { "en": "./victoria - helper tools for swimmers", "no": "./victoria - hjelpeverktøy for svømmere" }

	}
}

function Translator() {
	let url = window.location.href;	
	this.url = url.substring(0, url.indexOf("dot-slash-victoria") + "dot-slash-victoria".length);
	this.path = url.substring(this.url.length);
	this.page = this.path.substring(this.path.lastIndexOf("/") + 1, this.path.lastIndexOf("."));
	this.pages = pages;
	this.SetLanguage = function(lang) {
		this.language = lang;	
		for (let p in pages) {
			this.LoadTranslation(p, lang);
		}
		this.Translate();
	}
	this.addTranslations = function(page, language, translations) {

	}
	this.getTranslation = function(key, page) {
		page = page || this.page;
		if (!this.pages[page]) page = "base";
		const p = this.pages[page];
		if (!p[key]) {
			if (page != "base") return this.getTranslation(key, "base");
			return false;
		}
		const val = p[key];
		if (!val[this.language]) return val.en;
		return val[this.language];
	}
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


window.addEventListener("load", function() {
	
});
