const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('giveaways');

class Giveaway extends BaseModel {
    constructor(data) {
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            // Basic strict equality check for query
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new Giveaway(item) : null;
    }

    // Giveaways have custom query needs (dates)
    static async find(query) {
        let items = store.data;

        // Handle simple equality
        items = items.filter(d => {
            const simpleKeys = Object.keys(query).filter(k => typeof query[k] !== 'object');
            return simpleKeys.every(k => d[k] === query[k]);
        });

        // Handle date operator $lt
        if (query.endAt && query.endAt.$lt) {
            const targetDate = new Date(query.endAt.$lt).getTime();
            items = items.filter(d => new Date(d.endAt).getTime() < targetDate);
        }

        return items.map(i => new Giveaway(i));
    }

    static async create(data) {
        if (!data._id) data._id = randomUUID();
        if (data.ended === undefined) data.ended = false;
        if (!data.winnerIds) data.winnerIds = [];

        const instance = new Giveaway(data);
        await instance.save();
        return instance;
    }
}

module.exports = Giveaway;
