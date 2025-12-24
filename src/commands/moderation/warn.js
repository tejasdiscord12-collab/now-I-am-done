const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');
const config = require('../../config');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the warning').setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: 'You cannot warn this user.', ephemeral: true });
        }

        let warningData = await Warning.findOne({ guildId: interaction.guild.id, userId: user.id });
        if (!warningData) {
            warningData = new Warning({ guildId: interaction.guild.id, userId: user.id, warnings: [] });
        }

        warningData.warnings.push({
            moderatorId: interaction.user.id,
            reason: reason,
        });

        await warningData.save();

        const warnCount = warningData.warnings.length;
        let actionTaken = 'Warned';

        // Auto Punishment
        if (warnCount === 3) {
            try {
                await member.timeout(10 * 60 * 1000, 'Auto Mute: 3 Warnings'); // 10 min mute
                actionTaken = 'Warned + Auto Muted (10m)';
            } catch (err) {
                logger.error('Failed to auto mute', err);
            }
        } else if (warnCount >= 5) {
            try {
                await member.ban({ reason: 'Auto Ban: 5 Warnings' });
                actionTaken = 'Warned + Auto Banned';
            } catch (err) {
                logger.error('Failed to auto ban', err);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('User Warned')
            .setColor(config.colors.warning)
            .addFields(
                { name: 'User', value: `${user}`, inline: true },
                { name: 'Moderator', value: `${interaction.user}`, inline: true },
                { name: 'Reason', value: reason, inline: true },
                { name: 'Warnings', value: `${warnCount}`, inline: true },
                { name: 'Action', value: actionTaken, inline: true }
            )
            .setTimestamp();

        // Log to #mod-logs
        const logChannel = interaction.guild.channels.cache.find(c => c.name === 'mod-logs');
        if (logChannel) logChannel.send({ embeds: [embed] });

        await interaction.reply({ embeds: [embed] });
        try {
            await user.send(`You have been warned in ${interaction.guild.name} for: ${reason}`);
        } catch (e) { }
    },
};
