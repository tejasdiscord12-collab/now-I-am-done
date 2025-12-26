const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcomemessage')
        .setDescription('Set a custom welcome message with placeholders')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Welcome message (use {user}, {username}, {server}, {membercount}, {inviter})')
                .setRequired(true)
        ),
    async execute(interaction) {
        const message = interaction.options.getString('message');

        let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
        if (!settings) {
            settings = new GuildSettings({
                guildId: interaction.guild.id,
                welcomeMessage: message
            });
        } else {
            settings.welcomeMessage = message;
        }

        await settings.save();

        await interaction.reply({
            content: `✅ Welcome message updated!\n\n**Preview:**\n${message}\n\n**Available placeholders:**\n\`{user}\` - User mention\n\`{username}\` - User's name\n\`{server}\` - Server name\n\`{membercount}\` - Member count\n\`{inviter}\` - Person who invited them`,
            ephemeral: true
        });
    },
};
