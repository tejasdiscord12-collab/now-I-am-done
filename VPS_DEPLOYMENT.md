# VPS Deployment Guide

## Pull Code from GitHub

### Step 1: Connect to VPS
```bash
ssh your_username@your_vps_ip
```

### Step 2: Clone Repository
```bash
cd ~
git clone https://github.com/tejasdiscord12-collab/now-I-am-done.git
cd now-I-am-done
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Configure Environment
```bash
nano .env
```

Add these lines:
```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
MONGO_URI=not_needed
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 5: Run Bot with PM2 (24/7)
```bash
# Install PM2 globally
npm install -g pm2

# Start bot
pm2 start index.js --name desactbot

# Save PM2 configuration
pm2 save

# Enable PM2 to start on boot
pm2 startup
```

## Useful PM2 Commands

```bash
# View bot status
pm2 status

# View bot logs
pm2 logs desactbot

# Restart bot
pm2 restart desactbot

# Stop bot
pm2 stop desactbot

# Delete bot from PM2
pm2 delete desactbot
```

## Update Bot (Pull Latest Changes)

```bash
cd ~/now-I-am-done
git pull origin main
npm install
pm2 restart desactbot
```

## Troubleshooting

### Bot not starting?
```bash
pm2 logs desactbot
```

### Check if bot is running
```bash
pm2 status
```

### Restart everything
```bash
pm2 restart all
```
