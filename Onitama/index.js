load("ai/list.js");
load("util.js");

function addOption(s, name) {
  var o = document.createElement("option");
  o.setAttribute("value", name.toLowerCase());
  o.appendChild(document.createTextNode(name));
  s.appendChild(o);
}

window.addEventListener("load", function() {
  var p1Select = getById("p1Select");
  var p2Select = getById("p2Select");
  for (var i = 0; i < kAiList.length; ++i) {
    addOption(p1Select, kAiList[i]);
    addOption(p2Select, kAiList[i]);
  }
});