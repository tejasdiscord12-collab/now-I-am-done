const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings of a user')
        .addUserOption(option => option.setName('user').setDescription('User to check').setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const warningData = await Warning.findOne({ guildId: interaction.guild.id, userId: user.id });

        if (!warningData || warningData.warnings.length === 0) {
            return interaction.reply({ content: 'This user has no warnings.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${user.username}`)
            .setColor(config.colors.warning)
            .setThumbnail(user.displayAvatarURL());

        warningData.warnings.forEach((w, i) => {
            embed.addFields({
                name: `Warning ${i + 1}`,
                value: `**Reason:** ${w.reason}\n**Mod:** <@${w.moderatorId}>\n**Date:** <t:${Math.floor(w.timestamp.getTime() / 1000)}:R>`
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
