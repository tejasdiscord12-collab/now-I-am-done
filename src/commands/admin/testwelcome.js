const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testwelcome')
        .setDescription('Test the welcome message')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });

        let welcomeChannel = null;
        if (settings && settings.welcomeChannelId) {
            welcomeChannel = interaction.guild.channels.cache.get(settings.welcomeChannelId);
        } else {
            welcomeChannel = interaction.guild.channels.cache.find(channel => channel.name === 'welcome');
        }

        if (!welcomeChannel) {
            return interaction.reply({ content: 'No welcome channel configured! Use `/setwelcome` to set one.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Welcome to ${interaction.guild.name}!`)
            .setDescription(`Hello ${interaction.user}, welcome to the server!\n\nUser Count: **${interaction.guild.memberCount}**\nInvited By: **Test Inviter**`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor(config.colors.success);

        await welcomeChannel.send({ content: `${interaction.user}`, embeds: [embed] });
        await interaction.reply({ content: `Test welcome message sent to ${welcomeChannel}!`, ephemeral: true });
    },
};
