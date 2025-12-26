const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // Welcome Message
        const GuildSettings = require('../models/GuildSettings');
        const settings = await GuildSettings.findOne({ guildId: member.guild.id });

        let welcomeChannel = null;
        if (settings && settings.welcomeChannelId) {
            welcomeChannel = member.guild.channels.cache.get(settings.welcomeChannelId);
        } else {
            // Fallback to channel named "welcome"
            welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'welcome');
        }

        if (welcomeChannel) {
            const embed = new EmbedBuilder()
                .setTitle(`Welcome to ${member.guild.name}!`)
                .setDescription(`Hello ${member}, welcome to the server!\n\nUser Count: **${member.guild.memberCount}**`)
                .setThumbnail(member.user.displayAvatarURL())
                .setColor(config.colors.success);

            welcomeChannel.send({ content: `${member}`, embeds: [embed] });
        }
    },
};
