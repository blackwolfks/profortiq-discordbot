const { Events, ActivityType } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ Eingeloggt als ${client.user.tag}!`);
        
        // Bot-Status setzen
        client.user.setActivity('Support Tickets', { type: ActivityType.Watching });
        
        // Logger initialisieren
        client.logger = new Logger(client);
        await client.logger.init();
        
        console.log('🔧 Bot ist bereit und alle Systeme sind online!');
    }
};