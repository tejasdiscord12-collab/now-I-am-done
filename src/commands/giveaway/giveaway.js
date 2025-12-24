const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const ms = require('ms'); // We might need to install ms or use a helper
const Giveaway = require('../../models/Giveaway');
const config = require('../../config');
const { startGiveaway, endGiveaway, rerollGiveaway } = require('../../utils/giveawaySystem'); // We will create this

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a giveaway')
                .addStringOption(option => option.setName('duration').setDescription('Duration (e.g. 1m, 1h, 1d)').setRequired(true))
                .addIntegerOption(option => option.setName('winners').setDescription('Number of winners').setRequired(true))
                .addStringOption(option => option.setName('prize').setDescription('Prize to win').setRequired(true))
                .addChannelOption(option => option.setName('channel').setDescription('Channel to start giveaway in').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway')
                .addStringOption(option => option.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('Reroll a giveaway')
                .addStringOption(option => option.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true))
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            await startGiveaway(interaction);
        } else if (subcommand === 'end') {
            await endGiveaway(interaction);
        } else if (subcommand === 'reroll') {
            await rerollGiveaway(interaction);
        }
    },
};
