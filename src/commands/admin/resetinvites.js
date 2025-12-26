const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const InviteTracker = require('../../models/InviteTracker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetinvites')
        .setDescription('Reset invite tracking data')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to reset invites for (leave empty to reset entire server)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        let deletedCount = 0;

        if (targetUser) {
            // Reset for specific user
            deletedCount = await InviteTracker.deleteMany({
                guildId: interaction.guild.id,
                inviterId: targetUser.id
            });

            await interaction.reply({
                content: `✅ Reset ${deletedCount} invite record(s) for ${targetUser.tag}`,
                ephemeral: true
            });
        } else {
            // Reset entire server
            deletedCount = await InviteTracker.deleteMany({
                guildId: interaction.guild.id
            });

            await interaction.reply({
                content: `✅ Reset all invite tracking data for this server (${deletedCount} records)`,
                ephemeral: true
            });
        }
    },
};
