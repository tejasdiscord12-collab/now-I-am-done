// Invite Cache Manager - Stores guild invites in memory for tracking
const inviteCache = new Map();

/**
 * Fetch and cache all invites for a guild
 * @param {Guild} guild - Discord.js guild object
 */
async function cacheGuildInvites(guild) {
    try {
        const invites = await guild.invites.fetch();
        inviteCache.set(guild.id, new Map(invites.map(invite => [invite.code, invite.uses])));
    } catch (error) {
        console.error(`Failed to cache invites for guild ${guild.id}:`, error);
    }
}

/**
 * Compare cached invites with current invites to find which one was used
 * @param {Guild} guild - Discord.js guild object
 * @returns {Object|null} - Object with inviteCode and inviterId, or null if not found
 */
async function findUsedInvite(guild) {
    try {
        const newInvites = await guild.invites.fetch();
        const oldInvites = inviteCache.get(guild.id) || new Map();

        // Update cache
        inviteCache.set(guild.id, new Map(newInvites.map(invite => [invite.code, invite.uses])));

        // Find the invite that was used
        for (const [code, invite] of newInvites) {
            const oldUses = oldInvites.get(code) || 0;
            if (invite.uses > oldUses) {
                return {
                    inviteCode: code,
                    inviterId: invite.inviter?.id || null
                };
            }
        }

        // Sometimes invites are deleted or vanity URLs are used
        return null;
    } catch (error) {
        console.error(`Failed to find used invite for guild ${guild.id}:`, error);
        return null;
    }
}

module.exports = {
    inviteCache,
    cacheGuildInvites,
    findUsedInvite
};
