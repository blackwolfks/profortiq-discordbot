const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client) {
        // Ignoriere Bot-Nachrichten, System-Nachrichten und unverändertem Content
        if (newMessage.author?.bot || !newMessage.guild || oldMessage.content === newMessage.content) return;
        
        // Ignoriere Nachrichten in Ticket-Threads (Privacy)
        if (newMessage.channel.isThread() && newMessage.channel.parent?.id === client.config?.ticketChannelId) return;

        await client.logger.log('messageEdit', {
            author: newMessage.author,
            channel: newMessage.channel,
            oldContent: oldMessage.content,
            newContent: newMessage.content,
            messageUrl: newMessage.url
        });
    }
};