const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('tickets');

class Ticket extends BaseModel {
    constructor(data) {
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new Ticket(item) : null;
    }

    static async create(data) {
        if (!data._id) data._id = randomUUID();
        if (!data.claimedBy) data.claimedBy = null;
        if (data.closed === undefined) data.closed = false;
        if (!data.createdAt) data.createdAt = new Date().toISOString();

        const instance = new Ticket(data);
        await instance.save();
        return instance;
    }
}

module.exports = Ticket;
