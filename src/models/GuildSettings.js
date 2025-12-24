const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('guildsettings');

class GuildSettings extends BaseModel {
    constructor(data) {
        if (!data.welcomeChannelId) data.welcomeChannelId = null;
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new GuildSettings(item) : null;
    }
}

module.exports = GuildSettings;
