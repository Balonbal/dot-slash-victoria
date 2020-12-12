// Clear javascript text encoder to allow for leacy encoding options (ISO-8859)
window.TextEncoder = window.TextDecoder = null;
// We cannot get the file directly from medley due to browser security issues
const medley_url = "https://olavbb.com/dot-slash-victoria/medley_reserver"; // For testing

//Debug on local files
const debug = window.location.href.indexOf("127.0.0.1") != -1;
const base_url = debug ? "" : "https://balonbal.github.io/dot-slash-victoria";

const getResource = function (type, name) {
	return base_url + "/" + type + "/" + name;
}
const getImg = function(name) { return getResource("img", name); }

// --- Translations ---
function addLanguage(language) {
	let text;
	switch (language) {
		case "no": text = "Norsk"; break;
		case "en": text = "English"; break;
	}
	$("<a href='javascript:void(0)'></a>")
		.addClass("dropdown-item")
		.append($("<span>").addClass("t").text("lang_" + language))
		.on("click", () => {
			if (!translator) return;
			translator.SetLanguage(language);
			translator.Translate();
		}).appendTo($(".langList"));
}

//--- Tabs ---

function TabBarManager() {
	this.tabBars = [];

	this.load = function() {
		const _this = this;
		$(".tabBar").each(function () {
			_this.tabBars[this.id] = new TabBar(this);
		});
	}
	this.getBar = function (id) {
		return this.tabBars[id];
	}

	this.load();
}

function TabBar(base) {
	this.root = $(base);
	this.tabs = [];
	this.tabButtons = [];
	this.generate = function() {
		
		const tabMenu = $("<div>", {class: "tabMenu navbar"});
		
		const _this = this;
		this.root.children().each(function (i, child) {
			if (i != 0) child.classList.add("hidden");
			const disabled = child.getAttribute("data-disabled") == "true";
			_this.tabButtons[child.id] = $("<button>")
				.on("click", () => _this.showTab(child.id))
				.addClass("t btn btn-outline btn-outline-" + (disabled ? "disabled" : "primary"))
				.text(child.getAttribute("data-text"))
				.attr("id", "tabButton" + child.id)
				.attr("disabled", (i == 0 || disabled))
				.appendTo(tabMenu);
			_this.tabs[child.id] = $(child);
		});

		this.root.prepend(tabMenu);
	}

	this.enableTab = function(tabName) {
		this.tabButtons[tabName]
			.removeClass("btn-outline-disabled")
			.addClass("btn-outline-primary")
			.attr("disabled", false);
	}

	this.showTab = function(tab) {
		//Keep first child (the button bar) visible
		this.root.children(":not(:first-child)").addClass("hidden");
		this.tabs[tab].removeClass("hidden");
	}

	//Generate on creation
	this.generate();
}


// --- Modal ---
function showModal(id, body, cb_confirm, cb_cancel, options) {
	options = options || {};
	cb_cancel = cb_cancel || function() {};
	body = body || document.createTextNode("Are you sure you want to do that?");
	const modal = $("#" + id);
	if (!modal) return;
	modal.find(".modal-body").html("");
	modal.find(".modal-body").append(body);
	if (options.header) modal.find(".modal-title").text(options.header);
	
	const confirmBtn = modal.find(".modal-footer").find(".btn-success");
	confirmBtn.off("click");
	confirmBtn.on("click", function () {
		cb_confirm();
		modal.modal("hide");
	});
	modal.off("hidden.bs.modal");
	modal.on("hidden.bs.modal", function () {
		cb_cancel();
	});

	modal.modal();
	return modal;
}	



function addClickToEdit(element, display, field) {
	element.addEventListener("click", function() {
		display.element.classList.add("hidden");
		field.classList.remove("hidden");
	});

	field.addEventListener("change", function() { display.changeCB(field.value) });
	field.addEventListener("unfocus", function () {
		display.element.classList.remove("hidden");
		field.classList.add("hidden");
	});
}

let tabBarManager, themeManager;

function onLoad() {
	tabBarManager = new TabBarManager();
	themeManager = new ThemeManager();
}


function getMedleyMeet(url, callback) {
	const dest =medley_url + "/event.php?doc=" + url.substring(url.indexOf("/", url.indexOf("://") + 3));
	fetch(dest).then((response) => {
		//For some reason this xml is not UTF-8, we need to convert
		const reader = response.body.getReader();
		const decoder = new TextDecoder("iso-8859-1");
		
		let text = "";
		reader.read().then(function process(data) {
			if (data.done) return;
			text += decoder.decode(data.value, {stream: true});
			return reader.read().then(process);
		}).then(() => {
			callback(text);
		});
	});
}

function getMedleyList(callback) {
	const d = new Date();
	let url = medley_url;
	
	fetch(url + "/list.php").then((response) => response.text()).then(function (text) {
		const xml = parseXml(text);
		const meets = xml.ArrayOfStrc_stevneoppsett.strc_stevneoppsett;
		const result = [];
		for (let i in meets) {
			const m = meets[i];
			const start = getNode(m, "fradato");
			const end = getNode(m, "tildato");
			const meet = {
				name: getNode(m, "stevnenavn"),
				organizer: getNode(m, "arrangor"),
				url: getNode(m, "xmllink"),
				startDate: new Date(start.substring(0, 4) + "-" + start.substring(4, 6) + "-" + start.substring(6)),
				endDate: new Date(end.substring(0, 4) + "-" + end.substring(4, 6) + "-" + end.substring(6)),
			}
			result.push(meet);
		}
		callback(result);
	});
}

function download(filename, text) {
	var element = document.createElement('a');
	const data = new TextEncoder("iso-8859-15", {NONSTANDARD_allowLegacyEncoding: true}).encode(text);
	const b = new Blob([data], {type: "application/octet-stream"});
	const url = window.URL.createObjectURL(b);
	element.setAttribute('href', url);
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

$(() => onLoad());
//window.addEventListener("load", onLoad);
