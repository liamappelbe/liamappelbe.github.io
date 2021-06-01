// This function loads a script from a URL. All scripts that use this function
// and are loaded using script tags (rather than this function) should be
// placed in the head tag of your html. If you do that correctly, all scripts
// loaded by this function will be loaded and executed before the body.onload
// event runs. So any code that depends on a script loaded by this function
// should wait until body.onload is called. The script will only be loaded if
// it isn't already in a script tag (whether a hard coded one or one added by
// this function).
load = function(scriptUrl, opt_absolute) {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = (opt_absolute ? '' : '../') + scriptUrl;
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; ++i) {
    if (script.src == scripts[i].src) {
      return;
    }
  }
  var head = document.getElementsByTagName('head')[0];
  head.appendChild(script);
}

// This function loads images for drawing using a canvas. The image can't be
// used for drawing until window.onload.
loadImage = function(imageUrl, opt_absolute) {
  var img = document.createElement('img');
  img.src = (opt_absolute ? '' : '../') + imageUrl;
  img.style.display = 'none';
  var head = document.getElementsByTagName('head')[0];
  head.appendChild(img);
  return img;
}
