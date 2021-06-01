load('lib/artist.js');
load('lib/bind.js');
load('lib/vec.js');
load('SumoShip/physics.js');


Game = function(canvasElement, aiListElement) {
  this.artist = new Artist(canvasElement);
  this.aiListElement = aiListElement;
  this.tokens = {};
  this.frame = 0;
  this.ais = [];
  this.colors = [];
  this.img = [];
  this.cmd = [];
  this.loading = true;
  this.slowAi = -1;
  this.overText = '';
  this.overColor = 'white';

  // State is defined as anything that affects the physics or game logic.
  this.state = {
    // Pos, vel, rot and rotvel of each ship, and whether it's alive.
    ships: [],

    // Ship body shape, shared between all the ships.
    body: [{
      a: {x: -Game.shipSizeX, y: 0},
      b: {x: Game.shipSizeX, y: 0},
      r: Game.shipLineRad,
    }, {
      a: {x: -Game.shipSizeX, y: -Game.shipSizeY},
      b: {x: -Game.shipSizeX, y: Game.shipSizeY},
      r: Game.shipLineRad,
    }, {
      a: {x: Game.shipSizeX, y: -Game.shipSizeY},
      b: {x: Game.shipSizeX, y: Game.shipSizeY},
      r: Game.shipLineRad,
    }],

    // Physical constants.
    physics: {
      fieldSize: {x: Game.fieldSizeX, y: Game.fieldSizeY},
      grav: {x: 0, y: -1},
      dt: 0.01,
      mass: 1,
      momin: 0.1,
      corest: 0.2,
      rocketL: {x: -0.3, y: -0.1},
      rocketR: {x: 0.3, y: -0.1},
      thrust: 2,
    },
  };

  this.createAis();
  this.onResize();
  this.sendCmdRequests();
};

// Field layout.
Game.fieldSizeX = 6;
Game.fieldSizeY = Game.fieldSizeX * 0.6;
Game.spawnLineX = Game.fieldSizeX * 0.8;
Game.spawnLineY = Game.fieldSizeY * 0.2;
Game.spawnRot = 0.1;
Game.fieldWallWidth = 0.03;
Game.minCamSizeX = Game.fieldSizeX + 0.1;
Game.minCamSizeY = Game.fieldSizeY + 0.1;

// Ship shape.
Game.shipSizeX = 0.4;
Game.shipSizeY = 0.2;
Game.shipLineRad = 0.1;

// Messaging.
Game.maxDataLen = 1024;
Game.tokenLength = 2;  // In float suffixes, ~30 digits.
Game.tokenTTL = 600;  // In frames, ~10 seconds.

// Image assets.
Game.shipImg = loadImage('SumoShip/ship.png');
Game.fireImg = loadImage('SumoShip/fire.png');
Game.spaceImg = loadImage('SumoShip/space.png');

Game.prototype.onLoop = function() {
  if (this.loading) {
    var n = 0, ni = -1;
    for (var i = 0; i < this.cmd.length; ++i) {
      if (this.cmd[i] == null) {
        ++n;
        ni = i;
      }
    }
    if (n == 0) {
      this.loading = false;
    } else if (n == 1) {
      this.slowAi = ni;
    }
  }
  if (!this.loading) {
    ++this.frame;
    this.state = Physics.nextState(this.state, this.cmd);
    this.checkWins();
  }
  this.draw();
  this.sendCmdRequests();
};

Game.prototype.onResize = function() {
  this.artist.onResize();
  var camSize = this.artist.getCameraSize();
  if (camSize.x / Game.minCamSizeX < camSize.y / Game.minCamSizeY) {
    this.artist.setCameraWidth(Game.minCamSizeX);
  } else {
    this.artist.setCameraHeight(Game.minCamSizeY);
  }
  this.draw();
};

Game.prototype.createAis = function() {
  var split = window.location.search.substr(1).split('&');
  var urls = [];
  for (var i = 0, j = 0; i < split.length; ++i) {
    if (split[i].length > 0) {
      urls.push(split[i]);
    }
  }
  if (urls.length > 0) {
    var r = Math.random();
    for (var i = 0, j = 0; i < urls.length; ++i) {
      var url = decodeURIComponent(urls[i]);
      this.state.ships.push({
        p: Game.initPos(i, urls.length),
        v: {x: 0, y: 0},
        r: Game.initRot(i, urls.length),
        w: 0,
        alive: true,
      });
      this.cmd.push(null);
      var clr = Game.makeColor((i * 1.0 / urls.length) + r);
      var clrstr = 'rgb(' + clr.r + ', ' + clr.g + ', ' + clr.b + ')';
      this.colors.push(clrstr);
      this.img.push(Game.filterImage(
        Game.shipImg, Game.recolorFilter(clr)));
      this.ais.push(this.createAi(url, clrstr));
    }
  } else {
    var root = 'https://' + window.location.host + '/SumoShip/';
    this.aiListElement.innerHTML =
      '↑ Add an AI<br>Examples:<br>' +
      '<a href="' + root + 'keyAi.html?qw">Key mapped AI</a>' +
      '<a href="' + root + 'hoverAi.html">Hovering AI</a>' +
      '<a href="' + root + 'pushAi.html">Pushing AI</a>' +
      '<a href="' + root + 'spinAi.html">Spinning AI</a>';
  }
};

Game.prototype.checkWins = function() {
  var numAlive = 0, aliveShip = -1;
  for (var i = 0; i < this.state.ships.length; ++i) {
    if (this.state.ships[i].alive) {
      ++numAlive;
      aliveShip = i;
    }
  }
  if (this.ais.length > 1 && this.overText == "") {
    if (numAlive == 1) {
      this.overText = "Ship " + aliveShip + " wins!";
      this.overColor = this.colors[aliveShip];
    } else if (numAlive == 0) {
      this.overText = "It's a draw :/";
      this.overColor = 'white';
    }
  }
};

Game.prototype.sendCmdRequests = function() {
  // Clean up old tokens.
  for (token in this.tokens) {
    if (this.tokens.hasOwnProperty(token) &&
        this.tokens[token].frame + Game.tokenTTL < this.frame) {
      delete this.tokens[token];
    }
  }

  // Send command requests to all the ais.
  var statestr = JSON.stringify(this.state);
  for (var i = 0; i < this.ais.length; ++i) {
    if (this.state.ships[i].alive) {
      var token = Game.createToken();
      this.tokens[token] = {id: i, frame: this.frame};
      var msg = token + ',' + i + ',' + statestr;
      this.ais[i].contentWindow.postMessage(msg, window.location.origin);
    }
  }
};

Game.prototype.onResponse = function(e) {
  if (e.data.length > Game.maxDataLen) {
    console.log('Invalid response. Way too long, not even trying to parse.');
    return;
  }

  var data = e.data.split(',');
  if (data.length != 3) {
    console.log('Invalid response. Expected 3 comma delimited args, but ' +
      'received ' + data.length + '\nFull response: ' + e.data);
    return;
  }

  var id;
  if (!this.tokens.hasOwnProperty(data[0]) ||
      (typeof (id = this.tokens[data[0]].id) != 'number')) {
    console.log('Invalid token: ' + data[0] + '\nFull response: ' + e.data);
    return;
  }
  delete this.tokens[data[0]];
  if (!this.state.ships[id].alive) {
    return;
  }

  var l = parseFloat(data[1]);
  if (isNaN(l)) {
    console.log(
      'Invalid left thrust: ' + data[1] + '\nFull response: ' + e.data);
    return;
  }

  var r = parseFloat(data[2]);
  if (isNaN(r)) {
    console.log(
      'Invalid right thrust: ' + data[2] + '\nFull response: ' + e.data);
    return;
  }

  if (!(l > 0)) l = 0;  // !> instead of <, to catch NaN, null, undefined, etc.
  if (!(r > 0)) r = 0;
  if (l > 1) l = 1;
  if (r > 1) r = 1;

  this.cmd[id] = {l: l, r: r};
}

Game.prototype.draw = function() {
  this.artist.clear();
  if (this.loading) {
    this.artist.drawText(
      new Vec(0, 0), 'Loading...', 'white', '100px Arial', 'center');
    if (this.slowAi == -1) {
      this.artist.drawText(
        new Vec(0, -0.5), '(waiting for the first response from each AI)',
        'white', '20px Arial', 'center');
    } else {
      this.artist.drawText(
        new Vec(0, -0.5), 'Still waiting on AI ' + this.slowAi,
        this.colors[this.slowAi], '20px Arial', 'center');
    }
  } else {
    var oo = new Vec(0, 0);
    var fs = this.state.physics.fieldSize;
    var fw = Game.fieldWallWidth;

    var cs = this.artist.getCameraSize();
    if (cs.x * 108 < cs.y * 192) {
      this.artist.drawImageSharp(
        oo, new Vec(cs.y * 192 / 108.0, cs.y), 0, Game.spaceImg);
    } else {
      this.artist.drawImageSharp(
        oo, new Vec(cs.x, cs.x * 108 / 192.0), 0, Game.spaceImg);
    }

    var edge = [fs.x, fs.y, -fs.x, fs.y, -fs.x, -fs.y, fs.x, -fs.y];
    for (var i = 0; i < 8; i += 2) {
      this.artist.drawLine(
        new Vec(0.5 * edge[i], 0.5 * edge[i + 1]),
        new Vec(0.5 * edge[(i + 2) % 8], 0.5 * edge[(i + 3) % 8]),
        'red', 2);
    }

    for (var i = 0; i < this.state.ships.length; ++i) {
      if (this.state.ships[i].alive) {
        this.drawFire(this.state.ships[i], this.cmd[i]);
      }
    }
    for (var i = 0; i < this.state.ships.length; ++i) {
      if (this.state.ships[i].alive) {
        this.drawShip(this.state.ships[i], this.img[i]);
      }
    }
    this.artist.drawText(
      oo, this.overText, this.overColor, '100px Arial', 'center');
  }
}

Game.prototype.drawShip = function(ship, image) {
  var px = (Game.shipSizeX + Game.shipLineRad) / 20.0;
  this.artist.drawImageSharp(ship.p, new Vec(px * 42, px * 28), ship.r, image);
}

Game.prototype.drawFire = function(ship, cmd) {
  var px = (Game.shipSizeX + Game.shipLineRad) / 20.0;
  this.artist.drawImageSharp(
    Physics.toGlobal(ship, new Vec(
      -Game.shipSizeX,
      -Game.shipSizeY - Game.shipLineRad - 6 * px * (cmd.l - 0.5))),
    new Vec(px * 6, px * 8), ship.r, Game.fireImg);
  this.artist.drawImageSharp(
    Physics.toGlobal(ship, new Vec(
      Game.shipSizeX,
      -Game.shipSizeY - Game.shipLineRad - 6 * px * (cmd.r - 0.5))),
    new Vec(px * 6, px * 8), ship.r, Game.fireImg);
};

Game.prototype.createAi = function(url, color) {
  var iframe = document.createElement('IFRAME');
  iframe.src = Game.fixUrl(url);
  iframe.id = 'ai' + this.aiListElement.childNodes.length;
  iframe.style.backgroundColor = color;
  this.aiListElement.appendChild(iframe);
  return iframe;
}

Game.httpPattern = /^(https?)|(file):\/\//;
Game.fixUrl = function(url) {
  if (!Game.httpPattern.test(url)) {
    return 'http://' + url;
  }
  return url;
};

Game.hueShape = function(x) {
  x %= 6;
  if (x < 1) return x;
  if (x < 3) return 1;
  if (x < 4) return (4 - x);
  return 0;
};

Game.makeColor = function(hue) {
  hue = hue * 6;
  var r = Game.hueShape(hue);
  var g = Game.hueShape(hue + 2);
  var b = Game.hueShape(hue + 4);
  r = Math.floor(r * 256);
  g = Math.floor(g * 256);
  b = Math.floor(b * 256);
  r = r < 0 ? 0 : r > 255 ? 255 : r;
  g = g < 0 ? 0 : g > 255 ? 255 : g;
  b = b < 0 ? 0 : b > 255 ? 255 : b;
  return {r: r, g: g, b: b, a: 255};
};

Game.createToken = function() {
  var token = '';
  for (var i = 0; i < Game.tokenLength; ++i) {
    token += ('' + Math.random()).split('.')[1];
  }
  return token;
};

Game.initPos = function(i, n) {
  if (n == 1) return {x: 0, y: Game.spawnLineY};
  return {
    x: ((i / (n - 1.0)) - 0.5) * Game.spawnLineX,
    y: Game.spawnLineY,
  };
};

Game.initRot = function(i, n) {
  if (n == 1) return 0;
  return ((i / (n - 1.0)) - 0.5) * 2 * Game.spawnRot;
};

Game.filterImage = function(image, filter) {
  var c = document.createElement('canvas');
  c.width = image.width;
  c.height = image.height;
  var ctx = c.getContext('2d');
  ctx.drawImage(image, 0, 0);
  var pix = ctx.getImageData(0, 0, c.width, c.height);
  var d = pix.data;
  var dl = d.length;

  for (var i = 0; i < dl; i += 4) {
    var clr = filter(d[i], d[i + 1], d[i + 2], d[i + 3]);
    d[i] = clr.r;
    d[i + 1] = clr.g;
    d[i + 2] = clr.b;
    d[i + 3] = clr.a;
  }
  ctx.putImageData(pix, 0, 0);
  return c;
};

Game.recolorFilter = function(color) {
  return function(r, g, b, a) {
    if (r == b && r > g) {
      // This is a shade of magenta, so recolor it.
      var x = (r - g) / 256.0;
      return {
        r: color.r * x + g,
        g: color.g * x + g,
        b: color.b * x + g,
        a: color.a,
      };
    }
    return {r: r, g: g, b: b, a: a};
  };
};
