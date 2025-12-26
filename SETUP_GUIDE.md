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

---

## Bot Features & Commands

### 🎉 Welcome System

Set up a custom welcome system for new members:

- `/setwelcome #channel` - Set the welcome channel
- `/setwelcomemessage <message>` - Set custom welcome message with placeholders:
  - `{user}` - Mentions the user
  - `{username}` - User's name
  - `{server}` - Server name
  - `{membercount}` - Total member count
  - `{inviter}` - Person who invited them
- `/testwelcome` - Test your welcome message

### 📊 Invite Tracking

Track who invites members to your server:

- `/invites [@user]` - Check invite stats (total, active, left)
- `/inviteleaderboard` - View top 10 inviters
- `/resetinvites [@user]` - Reset invite data (admin only)

**Features:**
- Automatically tracks who invited each member
- Counts active invites (members still in server)
- Counts left invites (members who left)
- Detects fake invites (rejoins)

### 🎫 Ticket System

- `!cmf #channel` - Set up ticket system in a channel
- Use ticket panel buttons to create tickets

### 🎁 Giveaways

- `/g start` or `-gstart` - Start a giveaway
- `/g end <message_id>` - End a giveaway early
- `/g reroll <message_id>` - Reroll a winner

### 🛡️ Moderation

- `/warn @user <reason>` - Warn a user
- `/warnings @user` - View user warnings
- `/clearwarnings @user` - Clear warnings
- `/ban @user [reason]` - Ban a user
- `/kick @user [reason]` - Kick a user
- `/timeout @user <duration> [reason]` - Timeout a user

### 💬 Custom Commands

- `cmd add <name> <response>` - Create custom command
- `cmd remove <name>` - Delete custom command
- `cmd list` - List all custom commands

### ⭐ Review System

- `/review <message>` - Submit a review
- `/review channel set #channel` - Set review channel (admin)

---

## Quick Start

1. Enable required intents (see above)
2. Set welcome channel: `/setwelcome #general`
3. Customize welcome message: `/setwelcomemessage Welcome {user} to {server}! 🎉`
4. Invite tracking automatically starts working
5. Check invites with: `/invites`

