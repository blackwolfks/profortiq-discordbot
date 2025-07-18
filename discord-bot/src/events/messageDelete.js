const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    async execute(message, client) {
        // Ignoriere Bot-Nachrichten und System-Nachrichten
        if (message.author?.bot || !message.guild) return;
        
        // Ignoriere Nachrichten in Ticket-Threads (Privacy)
        if (message.channel.isThread() && message.channel.parent?.id === client.config?.ticketChannelId) return;

        await client.logger.log('messageDelete', {
            author: message.author,
            channel: message.channel,
            content: message.content,
            attachments: message.attachments.map(a => a.proxyURL)
        });
    }
};