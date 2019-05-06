// this part counts how many directories are between this file and parent directory
let allHrefParts = document.location.href.split("/");
let hrefParts = [];

for(i = 0; i < allHrefParts.length; i++){ // loop through the entire loop
    if(allHrefParts[i] == "dot-slash-victoria"){ // When "dot-slash-victoria" (parent directory) is found...
        for(j = 0; j < allHrefParts.length - i; j++){
            hrefParts[j] = allHrefParts[j + i]; // Add rest of the array to the new array
        }
    }
}
let numOfDirsToParent = hrefParts.length - 2;

function setTheme(theme){
    // save settings to users browser.
    window.localStorage.setItem("theme", theme);
    // prepare html style tag
    const PATH = "css\\themes\\";
    const STYLE_PREFIX = "<link id=\"theme-link\" rel=\"stylesheet\" type=\"text/css\" href=\"";
    const STYLE_SUFFIX = "/>";
    let insertion = STYLE_PREFIX;
    for (i = 0; i < numOfDirsToParent; i++) {
        insertion += "..\\";
    }   
    insertion += PATH + theme + ".css\"" + STYLE_SUFFIX;
    // remove the old html style
    document.getElementById("theme-link").remove();
    // insert the new html style
    document.head.innerHTML += insertion;
    // change the value of the dropdown theme selector
    document.getElementById("theme-selector").value = theme;
}

// drop down menu change listener
document.getElementById("theme-selector").addEventListener("change",function(){
    if(document.getElementById("theme-selector")){
        setTheme(document.getElementById("theme-selector").value);
    }
});