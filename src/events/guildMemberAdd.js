const { Events, EmbedBuilder } = require('discord.js');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // Handle Invite Tracking
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = member.client.invites.get(member.guild.id);
        const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));

        let inviter = null;
        if (invite) {
            inviter = invite.inviter;
            // Update cache
            member.client.invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
        }

        // Database Update
        if (inviter) {
            let userData = await User.findOne({ guildId: member.guild.id, userId: inviter.id });
            if (!userData) {
                userData = new User({ guildId: member.guild.id, userId: inviter.id });
            }

            // Check if this is a new invite or rejoin
            if (!userData.invitedUsers.includes(member.id)) {
                userData.invites += 1;

                // Check if account is fake (less than 7 days old)
                const accountAge = Date.now() - member.user.createdTimestamp;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;

                if (accountAge < sevenDays) {
                    userData.fake += 1;
                } else {
                    userData.real += 1;
                }

                userData.invitedUsers.push(member.id);
                await userData.save();
            }
        }

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
                .setDescription(`Hello ${member}, welcome to the server!\n\nUser Count: **${member.guild.memberCount}**\nInvited By: **${inviter ? inviter.tag : 'Unknown'}**`)
                .setThumbnail(member.user.displayAvatarURL())
                .setColor(config.colors.success);

            welcomeChannel.send({ content: `${member}`, embeds: [embed] });
        }
    },
};
