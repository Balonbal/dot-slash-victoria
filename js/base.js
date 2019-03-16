window.TextEncoder = window.TextDecoder = null;
// We cannot get the file directley from medley due to browser security issues
const medley_url = "https://olavbb.com/dot-slash-victoria/medley_reserver"; // For testing

function setTheme(title) {
	const styleSheets = document.getElementsByTagName("link");
	for (let i = 0; i < styleSheets.length; i++) {
		const sheet = styleSheets[i];
		sheet.disabled = sheet.relList.contains("alternate") && sheet.title != title;
	}
	storeTheme(title);
}

function storeTheme(theme) {
	window.localStorage.setItem("theme", theme);
}

function loadTheme() {
	const theme = window.localStorage.getItem("theme");
	if (theme) setTheme(theme);
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
		button.classList.add("btn", "btn-outline-" + (child.getAttribute("data-disabled") == "true" ? "disabled" : "primary"));
		button.innerText = child.getAttribute("data-text");
		button.disabled = i == 0 || child.getAttribute("data-disabled") == "true";
		console.log(child.innerText + " is " + button.disabled);
		button.id = "tabButton" + child.id;
		tabMenu.appendChild(button);
	}

	base.prepend(tabMenu);
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
}

function getMedleyMeet(url, callback) {
	const dest =medley_url + "/event.php?doc=" + url.substring(url.indexOf("/", url.indexOf("://") + 3));
	fetch(dest).then((response) => response.text()).then((text) => callback(text));
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

window.addEventListener("load", onLoad);



function themeChanger(){
	const selector = document.getElementsByClassName("selector");
	switch (selector.value) {
		case "dark":
			// set dark cocie in browser
			setTheme("dark");
			break;
		case "light":
			// set dark cocie in browser
			setTheme("light");
			break;
		default: 
			// set default theme which is dark
			setTheme("dark");
	}
	loadTheme();
}

window.addEventListener("change", themeChanger);

