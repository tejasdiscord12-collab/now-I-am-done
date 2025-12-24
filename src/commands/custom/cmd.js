const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const CustomCommand = require('../../models/CustomCommand');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Manage custom commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a custom command')
                .addStringOption(option => option.setName('trigger').setDescription('Trigger word (without prefix)').setRequired(true))
                .addStringOption(option => option.setName('response').setDescription('Response message').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a custom command')
                .addStringOption(option => option.setName('trigger').setDescription('Trigger word to delete').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all custom commands')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const trigger = interaction.options.getString('trigger');
        const response = interaction.options.getString('response');

        if (subcommand === 'create') {
            const existingCmd = await CustomCommand.findOne({ guildId: interaction.guild.id, trigger: trigger.toLowerCase() });
            if (existingCmd) {
                return interaction.reply({ content: `Command "${trigger}" already exists.`, ephemeral: true });
            }

            await CustomCommand.create({
                guildId: interaction.guild.id,
                trigger: trigger.toLowerCase(),
                response: response
            });

            await interaction.reply({ content: `Custom command "${trigger}" created!`, ephemeral: true });
        } else if (subcommand === 'delete') {
            const deleted = await CustomCommand.findOneAndDelete({ guildId: interaction.guild.id, trigger: trigger.toLowerCase() });
            if (!deleted) {
                return interaction.reply({ content: `Command "${trigger}" not found.`, ephemeral: true });
            }
            await interaction.reply({ content: `Custom command "${trigger}" deleted!`, ephemeral: true });
        } else if (subcommand === 'list') {
            const commands = await CustomCommand.find({ guildId: interaction.guild.id });
            if (commands.length === 0) {
                return interaction.reply({ content: 'No custom commands found.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Custom Commands')
                .setDescription(commands.map(cmd => `• **${cmd.trigger}**: ${cmd.response}`).join('\n'));

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
