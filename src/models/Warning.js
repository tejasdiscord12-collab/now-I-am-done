const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('warnings');

class Warning extends BaseModel {
    constructor(data) {
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new Warning(item) : null;
    }

    static async create(data) { // Not usually called directly, usually via constructor
        // But for compatibility with Mongoose code: new Warning(...)
    }
}

// Mongoose users do: const w = new Warning({...}); w.save();
// My BaseModel handles that via constructor if I allow it.
// The code in warn.js does:
/*
  let warningData = await Warning.findOne(...)
  if (!warningData) {
      warningData = new Warning({ ... });
  }
*/
// So constructor needs to register it.
// Actually, BaseModel constructor is: Object.assign(this, data).
// It doesn't save automatically. The code calls .save().
// So `new Warning(...)` works as expected. The only issue is `_store` binding.
// The code `new Warning(...)` will call the class constructor.
// My class constructor calls `super(store, data)`.
// So it works perfectly.

module.exports = Warning;
