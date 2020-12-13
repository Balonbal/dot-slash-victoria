// --- Themes ---
function ThemeManager() {
	this.theme = "default";
	this.makeThemeList = function() {
		this.addThemeToList("default");
		//Check all included stylesheets
		const sheets = $("link");
		for (let i = 0; i < sheets.length; i++) {	
			const sheet = sheets[i];
			if (sheet.relList.contains("alternate")) {
				this.addThemeToList(sheet.title);
				sheet.disabled = true;
			}
		}
	}
	this.addThemeToList = function(name) {
		const img = $("<img>", {
			src: getImg(name == "default" ? "light.png" : name + ".png"),
			style: "height: 1em",
			alt: name,
		});
		const themeText = $("<span>", {
			classList: ["t"],
			text: name,
		});

		$("<a>")
			.attr("href", "javascript:void(0)")
			.addClass("dropdown-item")
			.append(img)
			.append(themeText)
			.on("click", () => this.set(name))
			.appendTo($(".themeList"));
	}
	

	this.set = function(name) {
		console.log(name)
		const styleSheets = $("link");
		for (let i = 0; i < styleSheets.length; i++) {
			const sheet = styleSheets[i];
			sheet.disabled = sheet.relList.contains("alternate") && sheet.title != name;
		}
		$(".themeText").text(name);
		this.theme = name;
		this.save();
	}

	this.save = function() {
		window.localStorage.setItem("theme", this.theme);
	}

	this.load = function() {
		let theme = window.localStorage.getItem("theme");
		if (theme != null) this.set(theme);
		else this.set("default");
	}
	this.makeThemeList();
	this.load();
}
