const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const InviteTracker = require('../../models/InviteTracker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inviteleaderboard')
        .setDescription('Show the top inviters in the server'),
    async execute(interaction) {
        await interaction.deferReply();

        // Get all invites for this guild
        const allInvites = await InviteTracker.find({
            guildId: interaction.guild.id
        });

        // Group by inviter and calculate stats
        const inviterStats = new Map();

        for (const invite of allInvites) {
            if (!invite.inviterId) continue;

            if (!inviterStats.has(invite.inviterId)) {
                inviterStats.set(invite.inviterId, {
                    total: 0,
                    active: 0,
                    left: 0
                });
            }

            const stats = inviterStats.get(invite.inviterId);
            stats.total++;
            if (invite.isActive) {
                stats.active++;
            } else {
                stats.left++;
            }
        }

        // Convert to array and sort by total invites
        const sortedInviters = Array.from(inviterStats.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10); // Top 10

        if (sortedInviters.length === 0) {
            return interaction.editReply('No invite data available for this server yet.');
        }

        // Build leaderboard description
        let description = '';
        for (let i = 0; i < sortedInviters.length; i++) {
            const [userId, stats] = sortedInviters[i];
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            const username = member ? member.user.tag : `Unknown User (${userId})`;

            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
            description += `${medal} **${username}**\n`;
            description += `   📈 Total: ${stats.total} | ✅ Active: ${stats.active} | ❌ Left: ${stats.left}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Invite Leaderboard')
            .setDescription(description)
            .setColor(0xFFD700) // Gold
            .setFooter({ text: `${interaction.guild.name} • Top Inviters` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
