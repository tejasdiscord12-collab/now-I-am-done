const { Events } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        // Find who invited this user and decrement their stats
        const allUsers = require('../utils/jsonDb').JsonStore;
        const userStore = new allUsers('users');

        // Find the inviter by checking who has this member in their invitedUsers array
        const inviterData = userStore.data.find(u =>
            u.guildId === member.guild.id &&
            u.invitedUsers &&
            u.invitedUsers.includes(member.id)
        );

        if (inviterData) {
            let userData = await User.findOne({ guildId: member.guild.id, userId: inviterData.userId });
            if (userData) {
                // Decrement total invites
                userData.invites = Math.max(0, userData.invites - 1);

                // Increment left count
                userData.left += 1;

                // Decrement real count (assuming they were counted as real)
                // Check if they were fake or real
                const accountAge = Date.now() - member.user.createdTimestamp;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;

                if (accountAge < sevenDays && userData.fake > 0) {
                    userData.fake = Math.max(0, userData.fake - 1);
                } else if (userData.real > 0) {
                    userData.real = Math.max(0, userData.real - 1);
                }

                // Remove from invitedUsers array
                userData.invitedUsers = userData.invitedUsers.filter(id => id !== member.id);

                await userData.save();
            }
        }
    },
};
