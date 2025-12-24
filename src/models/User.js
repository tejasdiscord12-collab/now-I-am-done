const { JsonStore, BaseModel } = require('../utils/jsonDb');
const { randomUUID } = require('crypto');

const store = new JsonStore('users');

class User extends BaseModel {
    constructor(data) {
        // Set defaults for invite tracking
        if (!data.invites) data.invites = 0;
        if (!data.real) data.real = 0;
        if (!data.fake) data.fake = 0;
        if (!data.left) data.left = 0;
        if (!data.invitedUsers) data.invitedUsers = [];
        super(store, data);
    }

    static async findOne(query) {
        const item = store.data.find(d => {
            return Object.keys(query).every(key => d[key] === query[key]);
        });
        return item ? new User(item) : null;
    }
}

module.exports = User;
