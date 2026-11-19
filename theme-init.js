(function () {
  var isLight =
    localStorage.getItem('color-theme') === 'light' ||
    (!('color-theme' in localStorage) &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  if (isLight) {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  var themeMeta = document.getElementById('meta-theme-color');
  if (themeMeta) {
    var isTrazabilid = document.documentElement.classList.contains('theme-trazabilidapp');
    var darkColor = isTrazabilid ? '#121417' : '#0F0E0C';
    var lightColor = isTrazabilid ? '#F6F7F9' : '#F6F1E7';
    themeMeta.setAttribute('content', isLight ? lightColor : darkColor);
  }
})();
