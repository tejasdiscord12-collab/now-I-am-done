const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket panel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the panel to')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'setup') {
            const channel = interaction.options.getChannel('channel');

            const embed = new EmbedBuilder()
                .setTitle('🎫 Desact Tickets')
                .setDescription(
                    '**📩 Help Desk**\n\n' +
                    '🚨 To ensure efficient support for everyone, please adhere to the following guidelines when creating a ticket.\n\n' +
                    '**⚡ Select the Correct Ticket Type:**\n' +
                    '*First, use the dropdown menu to choose the category that best fits your request (e.g., Purchase, Bug Report, Support). This ensures your ticket goes to the right team immediately.*\n\n' +
                    '**⚡ State Your Purpose Clearly:**\n' +
                    '*After selecting a type, describe your reason for the ticket. Provide all necessary details concisely for a faster resolution.*\n\n' +
                    '**⚡ Stay Active:**\n' +
                    '*Please remain active in your ticket. Tickets will be automatically closed if we do not receive a reply from you within 48 hours.*\n\n' +
                    '• **Valid Tickets Only:** Tickets must contain a clear message.\n' +
                    '• **Empty tickets will be closed after 10 minutes.**\n\n' +
                    'ℹ️ **Creating false tickets or opening them without a valid reason will result in timeout.**\n\n' +
                    '~ Team Desact'
                )
                .setColor(config.colors.ticket)
                .setFooter({ text: 'Desact Support System' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_type_select')
                        .setPlaceholder('Select a support option')
                        .addOptions([
                            {
                                label: 'Server/VPS Purchase',
                                description: 'Create a ticket to purchase a new server or VPS hosting',
                                value: 'purchase',
                                emoji: '🖥️'
                            },
                            {
                                label: 'General Support',
                                description: 'Create this ticket if you have general questions or need assistance',
                                value: 'support',
                                emoji: '💚'
                            },
                            {
                                label: 'Server Issue/Bug Report',
                                description: 'Report technical issues with your server or VPS hosting',
                                value: 'bug',
                                emoji: '🚨'
                            }
                        ])
                );

            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `Ticket panel sent to ${channel}!`, ephemeral: true });
        }
    },
};
