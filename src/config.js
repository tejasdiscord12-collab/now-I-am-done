require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  mongoURI: process.env.MONGO_URI,
  clientId: process.env.CLIENT_ID,
  colors: {
    success: 0x00FF00,
    error: 0xFF0000,
    warning: 0xFFA500,
    info: 0x0000FF,
    giveaway: 0xFF69B4,
    ticket: 0x5865F2,
  }
};
