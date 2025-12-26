const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Check invite statistics for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check invites for (leave empty for yourself)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const { getInviteStatsEmbed } = require('../../utils/inviteUtils');

        try {
            const embed = await getInviteStatsEmbed(targetUser, interaction.guild, interaction.user);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in invites command:', error);
            await interaction.reply({ content: '❌ Failed to fetch invite stats.', ephemeral: true });
        }
    },
};
