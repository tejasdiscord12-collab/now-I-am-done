const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Check invite count')
        .addUserOption(option => option.setName('user').setDescription('User to check')),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const userData = await User.findOne({ guildId: interaction.guild.id, userId: user.id });

        const inviteCount = userData ? userData.invites : 0;

        await interaction.reply({ content: `**${user.username}** has **${inviteCount}** invites.` });
    },
};
