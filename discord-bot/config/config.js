require('dotenv').config();

module.exports = {
    // Bot Token und IDs
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    
    // Channel IDs
    ticketChannelId: process.env.TICKET_CHANNEL_ID,
    logChannelId: process.env.LOG_CHANNEL_ID,
    
    // Ticket Konfiguration
    ticketCategories: [
        { label: 'Technik', value: 'tech', emoji: '🔧' },
        { label: 'Kaufhilfe', value: 'purchase', emoji: '🛒' },
        { label: 'Bugs', value: 'bugs', emoji: '🐛' },
        { label: 'Sonstiges', value: 'other', emoji: '❓' }
    ],
    
    // Supporter Rolle (ID der Rolle die Tickets bearbeiten kann)
    supportRoleId: process.env.SUPPORT_ROLE_ID || null,
    
    // Embed Farben
    colors: {
        primary: 0x5865F2,
        success: 0x57F287,
        warning: 0xFEE75C,
        error: 0xED4245,
        info: 0x5865F2
    },
    
    // Logging Konfiguration
    logging: {
        messageDelete: true,
        messageEdit: true,
        memberJoin: true,
        memberLeave: true,
        memberBan: true,
        memberKick: true,
        roleUpdate: true,
        channelUpdate: true,
        serverUpdate: true,
        ticketActions: true
    }
};