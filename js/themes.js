// this part counts how many directories are between this file and parent directory
function numOfDirsToParent(){
    let allHrefParts = document.location.href.split("/");
    let hrefParts = [];

    for(i = 0; i < allHrefParts.length; i++){ // loop through the entire loop
        if(allHrefParts[i] == "dot-slash-victoria"){ // When "dot-slash-victoria" (parent directory) is found...
            for(j = 0; j < allHrefParts.length - i; j++){
                hrefParts[j] = allHrefParts[j + i]; // Add rest of the array to the new array
            }
        }
    }
    return hrefParts.length - 2;
}

function setTheme(theme){
    // save settings to users browser.
    window.localStorage.setItem("theme", theme);    
    let pathToRoot = "";
    for (i = 0; i < numOfDirsToParent(); i++){ pathToRoot += "../"; }
    $(document).ready(function(){
        $("#theme-link").attr("href", pathToRoot + "css/themes/" + theme + ".css");
    });
    
    document.getElementById("theme-selector").value = theme;
}

// drop down menu change listener
document.getElementById("theme-selector").addEventListener("change",function(){
    if(document.getElementById("theme-selector")){
        setTheme(document.getElementById("theme-selector").value);
    }
});