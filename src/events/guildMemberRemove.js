const { Events } = require('discord.js');
const InviteTracker = require('../models/InviteTracker');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        // Update invite tracker
        const inviteRecord = await InviteTracker.findOne({
            inviteeId: member.id,
            guildId: member.guild.id,
            isActive: true
        });

        if (inviteRecord) {
            inviteRecord.isActive = false;
            inviteRecord.leftAt = new Date().toISOString();
            await inviteRecord.save();
        }
    },
};
