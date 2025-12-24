const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const WordFilter = require('../../models/WordFilter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Manage prohibited words')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a word to the filter')
                .addStringOption(option => option.setName('word').setDescription('Word to add').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a word from the filter')
                .addStringOption(option => option.setName('word').setDescription('Word to remove').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all prohibited words')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const word = interaction.options.getString('word');

        let filter = await WordFilter.findOne({ guildId: interaction.guild.id });
        if (!filter) {
            filter = new WordFilter({ guildId: interaction.guild.id, words: [] });
        }

        if (subcommand === 'add') {
            if (filter.words.includes(word.toLowerCase())) {
                return interaction.reply({ content: 'Word already exists in filter.', ephemeral: true });
            }
            filter.words.push(word.toLowerCase());
            await filter.save();
            await interaction.reply({ content: `Added "${word}" to the filter.`, ephemeral: true });
        } else if (subcommand === 'remove') {
            if (!filter.words.includes(word.toLowerCase())) {
                return interaction.reply({ content: 'Word not found in filter.', ephemeral: true });
            }
            filter.words = filter.words.filter(w => w !== word.toLowerCase());
            await filter.save();
            await interaction.reply({ content: `Removed "${word}" from the filter.`, ephemeral: true });
        } else if (subcommand === 'list') {
            await interaction.reply({ content: `Prohibited Words: ${filter.words.join(', ') || 'None'}`, ephemeral: true });
        }
    },
};
