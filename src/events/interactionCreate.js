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

                await interaction.reply({ content: 'Generating transcript and closing ticket...' });

                // Generate Transcript
                try {
                    const transcriptChannel = guild.channels.cache.find(ch => ch.name === 'transcripts');

                    if (transcriptChannel) {
                        // Fetch all messages
                        const messages = await channel.messages.fetch({ limit: 100 });
                        const sortedMessages = Array.from(messages.values()).reverse();

                        // Create transcript text
                        let transcript = `# Ticket Transcript\n`;
                        transcript += `**Ticket Type:** ${ticket.ticketType || 'General'}\n`;
                        transcript += `**Created by:** <@${ticket.userId}>\n`;
                        transcript += `**Claimed by:** ${ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Unclaimed'}\n`;
                        transcript += `**Closed by:** ${member}\n`;
                        transcript += `**Created at:** <t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>\n`;
                        transcript += `**Closed at:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n`;
                        transcript += `## Messages:\n\n`;

                        for (const msg of sortedMessages) {
                            const timestamp = `<t:${Math.floor(msg.createdTimestamp / 1000)}:T>`;
                            transcript += `**${msg.author.tag}** ${timestamp}\n`;
                            if (msg.content) transcript += `${msg.content}\n`;
                            if (msg.attachments.size > 0) {
                                msg.attachments.forEach(att => {
                                    transcript += `📎 [${att.name}](${att.url})\n`;
                                });
                            }
                            transcript += `\n`;
                        }

                        // Split transcript if too long (Discord limit is 2000 chars per message)
                        const chunks = transcript.match(/[\s\S]{1,1900}/g) || [];

                        const transcriptEmbed = new EmbedBuilder()
                            .setTitle(`🎫 Ticket Transcript - ${channel.name}`)
                            .setDescription(`Ticket closed by ${member}`)
                            .setColor(config.colors.ticket)
                            .addFields(
                                { name: 'User', value: `<@${ticket.userId}>`, inline: true },
                                { name: 'Type', value: ticket.ticketType || 'General', inline: true },
                                { name: 'Messages', value: `${sortedMessages.length}`, inline: true }
                            )
                            .setTimestamp();

                        await transcriptChannel.send({ embeds: [transcriptEmbed] });

                        for (const chunk of chunks) {
                            await transcriptChannel.send({ content: `\`\`\`md\n${chunk}\n\`\`\`` });
                        }
                    }
                } catch (error) {
                    logger.error('Error generating transcript:', error);
                }

                // Mark as closed in DB
                ticket.closed = true;
                await ticket.save();

                setTimeout(async () => {
                    await channel.delete();
                }, 3000);
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
    },
};
