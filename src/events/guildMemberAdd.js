const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');
const { findUsedInvite } = require('../utils/inviteCache');
const InviteTracker = require('../models/InviteTracker');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const GuildSettings = require('../models/GuildSettings');
        const settings = await GuildSettings.findOne({ guildId: member.guild.id });

        // Track invite if enabled
        let inviterInfo = null;
        if (!settings || settings.inviteTrackingEnabled !== false) {
            const usedInvite = await findUsedInvite(member.guild);

            if (usedInvite) {
                // Check if this member left before (rejoining)
                const previousInvite = await InviteTracker.findOne({
                    inviteeId: member.id,
                    guildId: member.guild.id,
                    isActive: false
                });

                if (previousInvite) {
                    // Update existing record - member is rejoining
                    previousInvite.isActive = true;
                    previousInvite.leftAt = null;
                    previousInvite.inviteCode = usedInvite.inviteCode;
                    previousInvite.inviterId = usedInvite.inviterId;
                    await previousInvite.save();
                } else {
                    // Create new invite tracking record
                    const inviteRecord = new InviteTracker({
                        inviteCode: usedInvite.inviteCode,
                        inviterId: usedInvite.inviterId,
                        inviteeId: member.id,
                        guildId: member.guild.id
                    });
                    await inviteRecord.save();
                }

                inviterInfo = usedInvite;
            }
        }

        // Send welcome message
        let welcomeChannel = null;
        if (settings && settings.welcomeChannelId) {
            welcomeChannel = member.guild.channels.cache.get(settings.welcomeChannelId);
        } else {
            // Fallback to channel named "welcome"
            welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'welcome');
        }

        if (welcomeChannel) {
            // Get custom welcome message or use default
            let description = settings?.welcomeMessage ||
                `Welcome to **{server}**, {user}! 🎉\n\nYou are member **#{membercount}**!`;

            // Replace placeholders
            description = description
                .replace(/{user}/g, `${member}`)
                .replace(/{username}/g, member.user.username)
                .replace(/{server}/g, member.guild.name)
                .replace(/{membercount}/g, member.guild.memberCount);

            // Add inviter info if available
            if (inviterInfo && inviterInfo.inviterId) {
                const inviter = await member.guild.members.fetch(inviterInfo.inviterId).catch(() => null);
                if (inviter) {
                    description = description.replace(/{inviter}/g, `${inviter.user.tag}`);
                    description += `\n\n✨ Invited by **${inviter.user.tag}**`;
                }
            } else {
                description = description.replace(/{inviter}/g, 'Unknown');
            }

            // Create premium embed for zyrocloud
            const embed = new EmbedBuilder()
                .setTitle(`🌟 Welcome to ${member.guild.name}!`)
                .setDescription(description)
                .setColor(0x5865F2) // Discord Blurple
                .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                .setImage(member.user.bannerURL({ size: 1024 }) || null)
                .setFooter({
                    text: `Member #${member.guild.memberCount}`,
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            // Add server info field
            const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
            embed.addFields(
                {
                    name: '📊 Server Stats',
                    value: `👥 Members: **${member.guild.memberCount}**\n💎 Boost Level: **${member.guild.premiumTier}**`,
                    inline: true
                },
                {
                    name: '📅 Account Created',
                    value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n(${accountAge} days ago)`,
                    inline: true
                }
            );

            try {
                await welcomeChannel.send({
                    content: `${member}`,
                    embeds: [embed]
                });
            } catch (error) {
                logger.error('Failed to send welcome message:', error);
            }
        }
    },
};
