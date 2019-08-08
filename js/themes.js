function setTheme(theme) {
  // save settings to users browser.
  window.localStorage.setItem('theme', theme);

  if (theme === 'dark') {
    $('#theme-link-dark').attr('rel', 'stylesheet');
    $('#theme-link-light').attr('rel', 'alternate stylesheet');
  } else {
    $('#theme-link-dark').attr('rel', 'alternate stylesheet');
    $('#theme-link-light').attr('rel', 'stylesheet');
  }

  $('#theme-selector').val(theme);
}

// drop down menu change listener
$('#theme-selector').change(function () {
    if ($('#theme-selector')) {
      setTheme($('#theme-selector').val());
    }
  });