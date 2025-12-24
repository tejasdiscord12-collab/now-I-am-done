const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.success(`Ready! Logged in as ${client.user.tag}`);

        // Cache Invites
        client.invites = new Map();
        client.guilds.cache.forEach(async (guild) => {
            const firstInvites = await guild.invites.fetch().catch(err => console.log(err));
            if (firstInvites) {
                client.invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
            }
        });
    },
};
