# Discord Bot Setup Guide

## Error: "Used disallowed intents"

Your bot needs special permissions enabled in the Discord Developer Portal.

### Steps to Fix:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (ID: `1453389715385487636`)
3. Click **"Bot"** in the left sidebar
4. Scroll down to **"Privileged Gateway Intents"**
5. Enable the following intents:
   - ✅ **PRESENCE INTENT** (Optional, not critical)
   - ✅ **SERVER MEMBERS INTENT** (Required for invite tracking & welcome)
   - ✅ **MESSAGE CONTENT INTENT** (Required for auto-mod, custom commands, auto-reply)
6. Click **"Save Changes"**
7. Restart your bot: `node index.js`

### Why These Are Needed:
- **Server Members Intent**: Tracks when users join (for invite tracking & welcome messages)
- **Message Content Intent**: Reads message content (for auto-mod, custom commands, abuse filter)

After enabling these, your bot will start successfully.
