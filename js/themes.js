 function Styler() {
  this.SetTheme = function(theme) {
    this.theme = theme;
    window.localStorage.setItem("theme", theme);

    if(theme == "dark"){
	  $(".darkStyleSheet").removeAttr("disabled");
	  $(".lightStyleSheet").attr("disabled", "disabled");
    }else{
	  $(".darkStyleSheet").attr("disabled", "disabled");
	  $(".lightStyleSheet").removeAttr("disabled");
    }
  }
}

 function addTheme(theme) {
	let text;
	switch (theme) {
		case "light": text = "Light"; break;
		case "dark": text = "Dark"; break;
	}
	$("<a href='javascript:void(0)'></a>")
		.addClass("dropdown-item")
		.append($("<span>").addClass("t").text("theme_" + theme))
		.on("click", () => {
			if (!styler) return;
			styler.SetTheme(theme);
		}).appendTo($(".themeList"));
}

styler = new Styler();
window.addEventListener("load", function() {
  addTheme("light");
  addTheme("dark");
	let theme = window.localStorage.getItem("theme");
	styler.SetTheme(theme || "light");
});
