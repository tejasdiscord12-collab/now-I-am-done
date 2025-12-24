const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Duration (e.g. 10m, 1h)').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (!member.moderatable) return interaction.reply({ content: 'I cannot mute this user.', ephemeral: true });

        const msDuration = ms(duration);
        if (!msDuration) return interaction.reply({ content: 'Invalid duration.', ephemeral: true });

        await member.timeout(msDuration, reason);
        await interaction.reply({ content: `${user} has been muted for ${duration}. Reason: ${reason}` });
    },
};
