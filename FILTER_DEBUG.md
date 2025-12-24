# Message Filter Debug Guide

## Issue
The auto-mod filter for Hindi/English bad words is not deleting messages.

## Diagnosis Steps

### Step 1: Check if bot receives messages
1. Type any message in Discord (e.g., "hello" or "mc")
2. Look at the terminal running `node index.js`
3. You should see: `[INFO] Message received from YourName: hello`

### Step 2: If you see NOTHING in terminal
**Problem:** Message Content Intent is disabled

**Solution:**
1. Go to https://discord.com/developers/applications
2. Select your bot (ID: 1453389715385487636)
3. Click **Bot** tab
4. Scroll to **Privileged Gateway Intents**
5. Enable **MESSAGE CONTENT INTENT** ✅
6. Click **Save Changes**
7. Restart bot: Stop terminal (Ctrl+C) and run `node index.js` again

### Step 3: If you see messages but filter doesn't work
**Problem:** Bot lacks permissions

**Solution:**
1. In Discord server settings → Roles
2. Find your bot's role
3. Enable these permissions:
   - ✅ Manage Messages
   - ✅ Moderate Members
   - ✅ Ban Members
4. Move bot role ABOVE regular member roles

## Current Bad Words
English: fck, btch, ass, bastard
Hindi: mc, bc, madarchod, behenchod, chutiya

## Add More Words
Use `/filter add word:yourword`
