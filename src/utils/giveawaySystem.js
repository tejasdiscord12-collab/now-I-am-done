const Giveaway = require('../models/Giveaway');
const { EmbedBuilder } = require('discord.js');
const ms = require('ms');
const config = require('../config');
const logger = require('./logger');

async function startGiveaway(interaction) {
    const duration = interaction.options.getString('duration');
    const winnerCount = interaction.options.getInteger('winners');
    const prize = interaction.options.getString('prize');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const msDuration = ms(duration);
    if (!msDuration) return interaction.reply({ content: 'Invalid duration provided.', ephemeral: true });

    const endAt = new Date(Date.now() + msDuration);

    const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnerCount}\n**Hosted By:** ${interaction.user}\n**Ends:** <t:${Math.floor(endAt.getTime() / 1000)}:R>`)
        .setColor(config.colors.giveaway)
        .addFields({ name: 'Requirement', value: 'React with 🎉 to enter!' });

    const message = await channel.send({ embeds: [embed] });
    await message.react('🎉');

    await Giveaway.create({
        messageId: message.id,
        channelId: channel.id,
        guildId: interaction.guild.id,
        prize: prize,
        winnersCount: winnerCount,
        endAt: endAt,
        hostedBy: interaction.user.id,
    });

    await interaction.reply({ content: `Giveaway started in ${channel}!`, ephemeral: true });
}

async function endGiveaway(interaction) {
    const messageId = interaction.options.getString('message_id');
    const giveaway = await Giveaway.findOne({ messageId, ended: false });

    if (!giveaway) catchErr('Giveaway not found or already ended.', interaction);

    // We can just set the end time to now to trigger the checker, or force end it.
    // Let's force end it logic here for immediate response.

    // Actually, calling the pickWinner logic is better.
    // Let's defer to the handleEnding function.
    await pickWinner(giveaway, interaction.client);
    await interaction.reply({ content: 'Giveaway ended!', ephemeral: true });
}

async function rerollGiveaway(interaction) {
    const messageId = interaction.options.getString('message_id');
    const giveaway = await Giveaway.findOne({ messageId, ended: true }); // Must be ended to reroll

    if (!giveaway) return interaction.reply({ content: 'Giveaway not found or not ended yet.', ephemeral: true });

    await pickWinner(giveaway, interaction.client, true); // True for reroll
    await interaction.reply({ content: 'Rerolled!', ephemeral: true });
}

async function pickWinner(giveaway, client, isReroll = false) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);

        if (!message) return; // Message deleted

        const reaction = message.reactions.cache.get('🎉');
        if (!reaction) return channel.send('Could not find reaction cache.');

        const users = await reaction.users.fetch();
        const eligibleUsers = users.filter(u => !u.bot);

        if (eligibleUsers.size === 0) {
            if (!isReroll) {
                giveaway.ended = true;
                await giveaway.save();
                await message.reply('Giveaway ended, but no one entered!');
            } else {
                await message.reply('Rerolled, but no valid entries found!');
            }
            return;
        }

        const winners = [];
        // Simple random picker
        const userArray = Array.from(eligibleUsers.values());
        for (let i = 0; i < giveaway.winnersCount; i++) {
            if (userArray.length === 0) break;
            const randomIndex = Math.floor(Math.random() * userArray.length);
            winners.push(userArray[randomIndex]);
            userArray.splice(randomIndex, 1); // Remove winner so they don't win twice
        }

        const winnerMentions = winners.map(w => w.toString()).join(', ');

        const endEmbed = EmbedBuilder.from(message.embeds[0])
            .setColor(config.colors.giveaway)
            .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winnerMentions}\n**Hosted By:** <@${giveaway.hostedBy}>\n**Ended:** <t:${Math.floor(Date.now() / 1000)}:R>`);

        await message.edit({ embeds: [endEmbed] });
        await message.reply(`Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);

        if (!isReroll) {
            giveaway.ended = true;
            giveaway.winnerIds = winners.map(w => w.id);
            await giveaway.save();
        }

    } catch (err) {
        logger.error(`Error ending giveaway ${giveaway.messageId}`, err);
    }
}

async function checkGiveaways(client) {
    const endedGiveaways = await Giveaway.find({ ended: false, endAt: { $lt: new Date() } });
    for (const giveaway of endedGiveaways) {
        await pickWinner(giveaway, client);
    }
}

function catchErr(err, interaction) {
    interaction.reply({ content: err, ephemeral: true });
}

module.exports = { startGiveaway, endGiveaway, rerollGiveaway, checkGiveaways };
