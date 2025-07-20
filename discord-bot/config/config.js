require('dotenv').config();

module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    
    // Channel IDs (können später per Command gesetzt werden)
    channels: {
        logChannel: process.env.LOG_CHANNEL_ID || null,
        ticketChannel: null,
        ticketArchive: null
    },
    
    // Ticket Kategorien
    ticketCategories: [
        { name: 'Technik', emoji: '🔧', value: 'technik' },
        { name: 'Kaufhilfe', emoji: '🛒', value: 'kaufhilfe' },
        { name: 'Bugs', emoji: '🐛', value: 'bugs' },
        { name: 'Sonstiges', emoji: '📋', value: 'sonstiges' }
    ],
    
    // Support Team Rolle (kann per Command gesetzt werden)
    supportRole: null,
    
    // Embed Farben
    colors: {
        primary: 0x5865F2,    // Discord Blurple
        success: 0x57F287,    // Grün
        warning: 0xFEE75C,    // Gelb
        danger: 0xED4245,     // Rot
        info: 0x5865F2        // Blau
    },
    
    // Ticket Einstellungen
    ticketSettings: {
        maxTicketsPerUser: 3,
        deleteAfterClose: false,
        transcriptEnabled: true,
        dmTranscript: true
    }
};