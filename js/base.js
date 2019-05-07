window.TextEncoder = window.TextDecoder = null;
// We cannot get the file directley from medley due to browser security issues
const medley_url = "https://olavbb.com/dot-slash-victoria/medley_reserver"; // For testing
const themes = [];
const getResource = function (type, name) {
	let url = window.location.href;

	url = url.substring(0, url.indexOf("dot-slash-victoria") + "dot-slash-victoria".length);
	return url + "/" + type + "/" + name;
}
const getImg = function(name) { return getResource("img", name); }

function makeThemeList() {
	addTheme("default");
	const sheets = $("link");
	for (let i = 0; i < sheets.length; i++) {	
		const sheet = sheets[i];
		if (sheet.relList.contains("alternate")) addTheme(sheet.title);
	}
}

function addTheme(name) {
	if (themes.includes(name)) return;
	const img = document.createElement("img");
	img.src = getImg(name == "default" ? "light.png" : name + ".png");
	img.style.height = "1em";

	$("<a href='javascript:void(0)'></a>")
		.addClass("dropdown-item")
		.append(img)
		.append($("<span>").addClass("t").text("theme_" + name))
		.on("click", () => setTheme(name))
		.appendTo($(".themeList"));
}
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

function setTheme(title) {
	const styleSheets = document.getElementsByTagName("link");
	for (let i = 0; i < styleSheets.length; i++) {
		const sheet = styleSheets[i];
		sheet.disabled = sheet.relList.contains("alternate") && sheet.title != title;
	}
	$(".themeText").text(title);
	storeTheme(title);
}

function storeTheme(theme) {
	window.localStorage.setItem("theme", theme);
}

function loadTheme() {
	let theme = window.localStorage.getItem("theme");
	theme = theme || "default";
	setTheme(theme);
}

function generateTabBar(base) {
	
	let tabMenu = document.createElement("div");
	tabMenu.classList.add("tabMenu", "navbar");
	
	const children = base.children;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (i != 0) child.classList.add("hidden");
		const button = document.createElement("button");
		button.addEventListener("click", function () {
			showTab(base, child);
		});
		button.classList.add("t", "btn", "btn-outline-" + (child.getAttribute("data-disabled") == "true" ? "disabled" : "primary"));
		button.innerText = child.getAttribute("data-text");
		button.disabled = i == 0 || child.getAttribute("data-disabled") == "true";
		button.id = "tabButton" + child.id;
		tabMenu.appendChild(button);
	}

	base.prepend(tabMenu);
}

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

function enableTab(barName, tabName) {
	const button = document.getElementById("tabButton" + tabName);
	button.classList.remove("btn-outline-disabled");
	button.classList.add("btn-outline-primary");
	button.disabled = false;
}

function showTab(tabs, tab, disableTabs = true) {
	const children = tabs.children;
	for (let i = 1; i < children.length; i++) {
		const child = children[i];
		const visible = child == tab;
		if (visible) {
			child.classList.remove("hidden");
		} else {
			child.classList.add("hidden");
		}
	}

	if (!disableTabs) return;
	//Update button styles
	const buttons = children[0].children;
	for (let i = 0; i < buttons.length; i++) {
		const button = buttons[i];
		const active = button.innerText == tab.getAttribute("data-text");
		button.disabled = active;
	}
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

function onLoad() {
	const tabBars = document.getElementsByClassName("tabBar");
	for (let i = 0; i < tabBars.length; i++) {
		generateTabBar(tabBars[i]);
	}
	loadTheme();
	makeThemeList();
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

