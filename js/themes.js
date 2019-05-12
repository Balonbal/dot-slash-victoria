// this part counts how many directories are between this file and parent directory 
function numOfDirsToParent() {
  let allHrefParts = document.location.href.split('/');
  let hrefParts = [];
  for (i = 0; i < allHrefParts.length; i++) { // loop through the entire loop
    // When "dot-slash-victoria" (parent directory) is found...
    if (allHrefParts[i] == 'dot-slash-victoria') {
      for (j = 0; j < allHrefParts.length - i; j++) {
        hrefParts[j] = allHrefParts[j + i]; // Add rest of the array to the new array
      }

    }

  }

  return hrefParts.length - 2;
}

function setTheme(theme) {
  // save settings to users browser.
  window.localStorage.setItem('theme', theme);
  /*
  let pathToRoot = '';
  for (i = 0; i < numOfDirsToParent(); i++) {
    pathToRoot += '../';
  }
  */

  if (theme === 'dark') {
    $('#theme-link-dark').attr('rel', 'stylesheet');
    $('#theme-link-light').attr('rel', 'alternate stylesheet');
  } else {
    $('#theme-link-dark').attr('rel', 'alternate stylesheet');
    $('#theme-link-light').attr('rel', 'stylesheet');
  }

  $('.theme-selector').val(theme);
}

// drop down menu change listener
$('#theme-selector').change(function () {
    console.log('theme change detected! ' + $('#theme-selector').val());
    if ($('#theme-selector')) {
      setTheme($('#theme-selector').val());
    }
  });