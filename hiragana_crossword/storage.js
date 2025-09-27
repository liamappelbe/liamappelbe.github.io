class Storage {
  constructor(name, version = 1) {
    this._name = name;
    this._version = version;
  }

  _key(key) { return `${this._name} ${this._version} ${key}`; }
  set(key, value) { window.localStorage.setItem(this._key(key), value); }
  get(key) { return window.localStorage.getItem(this._key(key)); }
  remove(key) { return window.localStorage.removeItem(this._key(key)); }
}
