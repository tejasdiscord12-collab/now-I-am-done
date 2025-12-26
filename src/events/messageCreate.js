const { Events, EmbedBuilder, PermissionsBitField } = require('discord.js');
const WordFilter = require('../models/WordFilter');
const Warning = require('../models/Warning');
const CustomCommand = require('../models/CustomCommand');
const config = require('../config');
const logger = require('../utils/logger');

// Default bad words list
const defaultBadWords = [
    'fck', 'btch', 'ass', 'bastard',
    'mc', 'bc', 'madarchod', 'behenchod', 'chutiya'
];

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        // Debug: Log that we received a message
        logger.info(`Message received from ${message.author.tag}: ${message.content.substring(0, 50)}`);

        // 1. Auto Reply
        const content = message.content.toLowerCase();

        if (content.includes('price')) {
            const embed = new EmbedBuilder()
                .setTitle('Pricing')
                .setDescription('Here are our prices:\n- Basic: $5\n- Pro: $10\n- Enterprise: $20')
                .setColor(config.colors.info);
            message.channel.send({ embeds: [embed] });
        }

        if (content.includes('ping')) {
            message.channel.send(`Pong! Latency is ${Date.now() - message.createdTimestamp}ms.`);
        }

        if (content.includes('payment')) {
            const embed = new EmbedBuilder()
                .setTitle('Payment Methods')
                .setDescription('We accept PayPal, Credit Card, and Crypto.')
                .setColor(config.colors.info);
            message.channel.send({ embeds: [embed] });
        }

        // 2. Auto Mod - Invite Links & Scams
        const inviteRegex = /(discord.gg\/|discord.com\/invite\/)/i;
        const linkRegex = /(https?:\/\/[^\s]+)/g;

        if (inviteRegex.test(message.content)) {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                await message.delete();
                message.channel.send(`${message.author}, invites are not allowed!`).then(m => setTimeout(() => m.delete(), 5000));
                return;
            }
        }

        // Basic scam link protection (very basic)
        if (content.includes('free nitro') || content.includes('steam gift')) {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                await message.delete();
                message.channel.send(`${message.author}, scam links are not allowed!`).then(m => setTimeout(() => m.delete(), 5000));
                return;
            }
        }


        // 3. Auto Abuse Filter
        let badWords = [...defaultBadWords];
        const dbFilter = await WordFilter.findOne({ guildId: message.guild.id });
        if (dbFilter) {
            badWords = [...badWords, ...dbFilter.words];
        }

        const foundBadWord = badWords.find(word => content.includes(word.toLowerCase()));
        if (foundBadWord) {
            if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return; // Admins bypass

            try {
                await message.delete();
                message.channel.send(`${message.author}, do not use abusive language!`).then(m => setTimeout(() => m.delete(), 5000));
                logger.info(`Deleted message from ${message.author.tag} for using: ${foundBadWord}`);
            } catch (error) {
                logger.error(`Failed to delete message: ${error.message}`);
                return; // If we can't delete, don't warn
            }

            // Warn Logic
            let warningData = await Warning.findOne({ guildId: message.guild.id, userId: message.author.id });
            if (!warningData) {
                warningData = new Warning({ guildId: message.guild.id, userId: message.author.id, warnings: [] });
            }

            warningData.warnings.push({
                moderatorId: message.client.user.id,
                reason: `Auto Mod: Used bad word "${foundBadWord}"`,
            });
            await warningData.save();

            // Auto Punish
            const warnCount = warningData.warnings.length;
            if (warnCount === 1) {
                message.channel.send(`${message.author} has been warned. (1/3)`);
            } else if (warnCount === 2) {
                // 2nd -> Mute
                try {
                    await message.member.timeout(10 * 60 * 1000, 'Auto Mod: Abusive Language (2nd Offense)');
                    message.channel.send(`${message.author} has been muted for 10 minutes.`);
                } catch (e) {
                    logger.error(`Failed to timeout user: ${e.message}`);
                }
            } else if (warnCount >= 3) {
                // 3rd -> Ban
                try {
                    await message.member.ban({ reason: 'Auto Mod: Abusive Language (3rd Offense)' });
                    message.channel.send(`${message.author} has been banned.`);
                } catch (e) {
                    logger.error(`Failed to ban user: ${e.message}`);
                }
            }
        }



        // 5. Custom Commands
        const customCmd = await CustomCommand.findOne({ guildId: message.guild.id, trigger: content });
        if (customCmd) {
            message.channel.send(customCmd.response);
        }
    },
};
