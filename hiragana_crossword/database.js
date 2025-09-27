class Database {
  static async open(name, version = 1) {
    return new Database(await _dbProm(window.indexedDb.open(name, version)));
  }

  constructor(db) { this._db = db; }
}

function _dbProm(dbRequest) {
  return Promise((resolve, reject) => {
    dbRequest.onsuccess = () => resolve(dbRequest.result);
    dbRequest.onerror = () => reject(dbRequest.error);
  });
}
