const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('invites');

class InviteTracker extends BaseModel {
    constructor(data) {
        if (!data.id) data.id = randomUUID();
        if (!data.inviteCode) data.inviteCode = null;
        if (!data.inviterId) data.inviterId = null;
        if (!data.inviteeId) data.inviteeId = null;
        if (!data.guildId) data.guildId = null;
        if (!data.joinedAt) data.joinedAt = new Date().toISOString();
        if (!data.leftAt) data.leftAt = null;
        if (data.isActive === undefined) data.isActive = true;
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new InviteTracker(item) : null;
    }

    static async find(query) {
        const items = store.data.filter(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return items.map(item => new InviteTracker(item));
    }

    static async deleteMany(query) {
        const initialLength = store.data.length;
        store.data = store.data.filter(d => {
            return !Object.keys(query).every(key => d[key] === query[key]);
        });
        store.save();
        return initialLength - store.data.length;
    }
}

module.exports = InviteTracker;
