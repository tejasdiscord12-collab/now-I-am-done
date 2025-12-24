const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user ID')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option => option.setName('userid').setDescription('User ID to unban').setRequired(true)),
    async execute(interaction) {
        const userId = interaction.options.getString('userid');

        try {
            await interaction.guild.members.unban(userId);
            await interaction.reply({ content: `User with ID ${userId} has been unbanned.` });
        } catch (error) {
            await interaction.reply({ content: 'Failed to unban user. Are they banned?', ephemeral: true });
        }
    },
};
