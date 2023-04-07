function hitCountRequest(k, p) {
  const r = new XMLHttpRequest();
  r.type = 'text/plain';
  r.open('GET', `https://squeakysqueenoctopus.com/oqne?k=${k}&p=${p}`, true);
  r.send();
}
