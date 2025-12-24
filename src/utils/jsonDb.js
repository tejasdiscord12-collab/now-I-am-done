const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

class JsonStore {
    constructor(filename) {
        this.path = path.join(__dirname, '../../data', `${filename}.json`);
        this.data = [];
        this.load();
    }

    load() {
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify([], null, 2));
            this.data = [];
        } else {
            try {
                this.data = JSON.parse(fs.readFileSync(this.path, 'utf8'));
            } catch (error) {
                console.error(`Error loading database ${this.path}:`, error);
                this.data = [];
            }
        }
    }

    save() {
        fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    }
}

class BaseModel {
    constructor(store, data) {
        this._store = store;
        Object.assign(this, data);
    }

    async save() {
        const index = this._store.data.findIndex(d => d._id === this._id);
        if (index !== -1) {
            this._store.data[index] = { ...this }; // Update
            // Remove the internal _store reference before saving to JSON
            const toSave = { ...this };
            delete toSave._store;
            this._store.data[index] = toSave;
        } else {
            // Should not happen for existing items, but if new:
            if (!this._id) this._id = randomUUID();
            const toSave = { ...this };
            delete toSave._store;
            this._store.data.push(toSave);
        }
        this._store.save();
        return this;
    }
}

module.exports = { JsonStore, BaseModel };
