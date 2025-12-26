const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { REST, Routes } = require('discord.js');
const config = require('../config');

async function loadHandlers(client) {
    // Load Events
    const eventsPath = path.join(__dirname, '../events');
    if (fs.existsSync(eventsPath)) {
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            logger.info(`Loaded event: ${event.name}`);
        }
    }

    // Load Commands
    client.commands = new Map();
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');

    if (fs.existsSync(commandsPath)) {
        const commandFolders = fs.readdirSync(commandsPath);
        for (const folder of commandFolders) {
            // Skip if not a directory
            const folderPath = path.join(commandsPath, folder);
            if (!fs.lstatSync(folderPath).isDirectory()) continue;

            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                    logger.info(`Loaded command: ${command.data.name}`);
                } else {
                    logger.warn(`The command at ${filePath} is missing "data" or "execute" property.`);
                }
            }
        }
    }

    // Register Slash Commands
    if (config.token && config.clientId) {
        const rest = new REST().setToken(config.token);
        const guildId = '1453861508256764007'; // Your server ID
        (async () => {
            try {
                logger.info('Started refreshing application (/) commands (Guild-specific).');
                await rest.put(
                    Routes.applicationGuildCommands(config.clientId, guildId),
                    { body: commands },
                );
                logger.success('Successfully reloaded application (/) commands (Guild-specific).');
            } catch (error) {
                logger.error('Error reloading commands', error);
            }
        })();
    }
}

module.exports = { loadHandlers };
