const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { loadHandlers } = require('./src/utils/handlers');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildInvites,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();


// Load Handlers
loadHandlers(client);

// Giveaway Checker
const { checkGiveaways } = require('./src/utils/giveawaySystem');
setInterval(() => {
    checkGiveaways(client);
}, 10000); // Check every 10 seconds

client.login(config.token).catch(err => {
    logger.error('Failed to login bot', err);
});
