const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set the welcome message channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for welcome messages')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
        if (!settings) {
            settings = new GuildSettings({
                guildId: interaction.guild.id,
                welcomeChannelId: channel.id
            });
        } else {
            settings.welcomeChannelId = channel.id;
        }

        await settings.save();

        await interaction.reply({
            content: `✅ Welcome channel set to ${channel}!`,
            ephemeral: true
        });
    },
};
