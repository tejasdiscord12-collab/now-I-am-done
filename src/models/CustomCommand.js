const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('customcommands');

class CustomCommand extends BaseModel {
    constructor(data) {
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new CustomCommand(item) : null;
    }

    static async find(query) {
        const items = store.data.filter(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return items.map(i => new CustomCommand(i));
    }

    static async create(data) {
        if (!data._id) data._id = randomUUID();
        const instance = new CustomCommand(data);
        await instance.save();
        return instance;
    }

    static async findOneAndDelete(query) {
        const index = store.data.findIndex(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });

        if (index !== -1) {
            const item = store.data[index];
            store.data.splice(index, 1);
            store.save();
            return new CustomCommand(item);
        }
        return null;
    }
}

module.exports = CustomCommand;
