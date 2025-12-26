const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { cacheGuildInvites } = require('../utils/inviteCache');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.info(`Logged in as ${client.user.tag}!`);

        // Cache invites for all guilds
        for (const guild of client.guilds.cache.values()) {
            await cacheGuildInvites(guild);
        }
        logger.info('Invite cache initialized for all guilds');
    },
};
