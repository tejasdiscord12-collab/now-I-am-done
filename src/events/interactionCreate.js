const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                logger.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(`Error executing ${interaction.commandName}`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }

        // Handle Select Menus (Ticket Type Selection)
        if (interaction.isStringSelectMenu()) {
            const { customId, values, guild, member } = interaction;
            const Ticket = require('../models/Ticket');
            const config = require('../config');
            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

            if (customId === 'ticket_type_select') {
                await interaction.deferReply({ ephemeral: true });

                const existingTicket = await Ticket.findOne({ guildId: guild.id, userId: member.id, closed: false });
                if (existingTicket) {
                    return interaction.editReply({ content: `You already have an open ticket: <#${existingTicket.channelId}>` });
                }

                const ticketType = values[0];
                const typeNames = {
                    'purchase': 'Purchase',
                    'support': 'Support',
                    'bug': 'Bug Report'
                };

                // Create private channel
                const ticketChannel = await guild.channels.create({
                    name: `${ticketType}-${member.user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: member.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        }
                    ],
                });

                // Save to DB
                await Ticket.create({
                    guildId: guild.id,
                    channelId: ticketChannel.id,
                    userId: member.id,
                    ticketType: ticketType,
                });

                const embed = new EmbedBuilder()
                    .setTitle(`🎫 ${typeNames[ticketType]} Ticket`)
                    .setDescription(`**Ticket created by:** ${member}\n**Type:** ${typeNames[ticketType]}\n\nSupport will be with you shortly. Please describe your issue in detail.`)
                    .setColor(config.colors.ticket)
                    .setFooter({ text: 'Team Desact' });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Close')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🔒'),
                        new ButtonBuilder()
                            .setCustomId('claim_ticket')
                            .setLabel('Claim')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('🙋')
                    );

                await ticketChannel.send({ content: `${member}`, embeds: [embed], components: [row] });
                await interaction.editReply({ content: `Ticket created! <#${ticketChannel.id}>` });
            }
        }

        // Handle Buttons (Ticket System)
        if (interaction.isButton()) {
            const { customId, guild, member, channel } = interaction;
            const Ticket = require('../models/Ticket');
            const config = require('../config');
            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

            if (customId === 'close_ticket') {
                // Check if it's a ticket channel
                const ticket = await Ticket.findOne({ channelId: channel.id });
                if (!ticket) return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });

                if (ticket.closed) return interaction.reply({ content: 'Ticket is already closed.', ephemeral: true });

                // Show modal to ask for close reason
                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

                const modal = new ModalBuilder()
                    .setCustomId('close_ticket_modal')
                    .setTitle('Close Ticket');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel('Reason for closing')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Enter the reason for closing this ticket...')
                    .setRequired(true)
                    .setMinLength(5)
                    .setMaxLength(500);

                const actionRow = new ActionRowBuilder().addComponents(reasonInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }

            if (customId === 'close_ticket_modal') {
                // This is handled in the modal submit handler below
            }

            if (customId === 'claim_ticket') {
                const ticket = await Ticket.findOne({ channelId: channel.id });
                if (!ticket) return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });

                if (ticket.claimedBy) return interaction.reply({ content: `Ticket already claimed by <@${ticket.claimedBy}>`, ephemeral: true });

                ticket.claimedBy = member.id;
                await ticket.save();

                await interaction.reply({ content: `Ticket claimed by ${member}!` });
            }
        }

        // Handle Modal Submits (Close Ticket with Reason)
        if (interaction.isModalSubmit()) {
            const { customId, guild, member, channel } = interaction;
            const Ticket = require('../models/Ticket');
            const config = require('../config');
            const { EmbedBuilder } = require('discord.js');

            if (customId === 'close_ticket_modal') {
                const ticket = await Ticket.findOne({ channelId: channel.id });
                if (!ticket) return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });

                const closeReason = interaction.fields.getTextInputValue('close_reason');

                await interaction.reply({ content: 'Generating transcript and closing ticket...' });

                // Generate Simplified Transcript
                try {
                    const transcriptChannel = guild.channels.cache.find(ch => ch.name === 'transcripts');

                    if (transcriptChannel) {
                        // Fetch all messages to count unique participants
                        const messages = await channel.messages.fetch({ limit: 100 });
                        const uniqueParticipants = new Set();

                        messages.forEach(msg => {
                            if (!msg.author.bot) {
                                uniqueParticipants.add(msg.author.id);
                            }
                        });

                        const transcriptEmbed = new EmbedBuilder()
                            .setTitle(`🎫 Ticket Transcript - ${channel.name}`)
                            .setColor(config.colors.ticket)
                            .addFields(
                                { name: '👤 Created By', value: `<@${ticket.userId}>`, inline: true },
                                { name: '👥 Participants', value: `${uniqueParticipants.size}`, inline: true },
                                { name: '🔒 Closed By', value: `${member}`, inline: true },
                                { name: '📝 Reason', value: closeReason, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Team Desact' });

                        await transcriptChannel.send({ embeds: [transcriptEmbed] });
                    }
                } catch (error) {
                    logger.error('Error generating transcript:', error);
                }

                // Mark as closed in DB
                ticket.closed = true;
                ticket.closeReason = closeReason;
                ticket.closedBy = member.id;
                ticket.closedAt = new Date().toISOString();
                await ticket.save();

                setTimeout(async () => {
                    await channel.delete();
                }, 3000);
            }
        }
    },
};
