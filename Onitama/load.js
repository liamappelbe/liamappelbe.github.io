__loadedScripts = {};
load = function(scriptUrl) {
  if (__loadedScripts[scriptUrl] != null) return __loadedScripts[scriptUrl];
  var script = document.createElement('script');
  __loadedScripts[scriptUrl] = script;
  script.type = 'text/javascript';
  script.src = scriptUrl;
  var head = document.getElementsByTagName('head')[0];
  head.appendChild(script);
  return script;
}