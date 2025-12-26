const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');
const config = require('../../config');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review')
        .setDescription('Review system commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a review for the service')
                .addIntegerOption(option =>
                    option.setName('stars')
                        .setDescription('Star rating (1-5)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(5))
                .addStringOption(option =>
                    option.setName('comment')
                        .setDescription('Your feedback')
                        .setRequired(true)))
        .addSubcommandGroup(group =>
            group
                .setName('channel')
                .setDescription('Configure review channel')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set the channel for reviews')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('The channel to post reviews in')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);

        if (group === 'channel' && subcommand === 'set') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ You need Administrator permissions to use this command!', ephemeral: true });
            }

            const channel = interaction.options.getChannel('channel');
            let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });

            if (!settings) {
                settings = new GuildSettings({
                    guildId: interaction.guild.id,
                    reviewChannelId: channel.id
                });
            } else {
                settings.reviewChannelId = channel.id;
            }

            await settings.save();
            return interaction.reply({ content: `✅ Review channel has been set to ${channel}!`, ephemeral: true });
        }

        if (subcommand === 'add') {
            const stars = interaction.options.getInteger('stars');
            const comment = interaction.options.getString('comment');

            const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });

            if (!settings || !settings.reviewChannelId) {
                return interaction.reply({ content: '❌ The review system is not configured yet. Please ask an admin to set a review channel!', ephemeral: true });
            }

            const reviewChannel = interaction.guild.channels.cache.get(settings.reviewChannelId);
            if (!reviewChannel) {
                return interaction.reply({ content: '❌ The configured review channel no longer exists!', ephemeral: true });
            }

            const starsString = '⭐'.repeat(stars);

            const reviewEmbed = new EmbedBuilder()
                .setTitle('🌟 New Review!')
                .setDescription(comment)
                .setColor(config.colors.info)
                .addFields(
                    { name: 'Rating', value: starsString, inline: true },
                    { name: 'Reviewer', value: interaction.user.tag, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Review ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}` });

            try {
                await reviewChannel.send({ embeds: [reviewEmbed] });
                return interaction.reply({ content: '✅ Your review has been submitted! Thank you.', ephemeral: true });
            } catch (error) {
                logger.error(`Error sending review: ${error.message}`);
                return interaction.reply({ content: '❌ There was an error submitting your review. Please try again later.', ephemeral: true });
            }
        }
    },
};
