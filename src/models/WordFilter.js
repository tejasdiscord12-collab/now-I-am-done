const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('wordfilter');

class WordFilter extends BaseModel {
    constructor(data) {
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new WordFilter(item) : null;
    }
}

module.exports = WordFilter;
