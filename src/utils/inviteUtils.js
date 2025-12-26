const { EmbedBuilder } = require('discord.js');
const InviteTracker = require('../models/InviteTracker');

/**
 * Get invite statistics for a user and return an embed
 * @param {User} targetUser - The user to check invites for
 * @param {Guild} guild - The guild where invites are checked
 * @param {User} requester - The user who requested the stats
 * @returns {Promise<EmbedBuilder>} - A promise that resolves to an EmbedBuilder
 */
async function getInviteStatsEmbed(targetUser, guild, requester) {
    // Get all invites by this user
    const allInvites = await InviteTracker.find({
        guildId: guild.id,
        inviterId: targetUser.id
    });

    const totalInvites = allInvites.length;
    const activeInvites = allInvites.filter(inv => inv.isActive).length;
    const leftInvites = allInvites.filter(inv => !inv.isActive).length;

    const embed = new EmbedBuilder()
        .setTitle(`📊 Invite Stats for ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setColor(0x5865F2)
        .addFields(
            { name: '📈 Total Invites', value: `${totalInvites}`, inline: true },
            { name: '✅ Active Invites', value: `${activeInvites}`, inline: true },
            { name: '❌ Left Server', value: `${leftInvites}`, inline: true }
        )
        .setFooter({ text: `Requested by ${requester.tag}` })
        .setTimestamp();

    return embed;
}

module.exports = {
    getInviteStatsEmbed
};
