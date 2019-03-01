window.TextEncoder = window.TextDecoder = null;
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

function showTab(tabs, tab) {
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
