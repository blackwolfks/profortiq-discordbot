const { AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class TranscriptGenerator {
    async generateTranscript(thread) {
        try {
            // Hole alle Nachrichten aus dem Thread
            const messages = await this.fetchAllMessages(thread);
            
            // Erstelle HTML-Transkript
            const html = await this.generateHTML(thread, messages);
            
            // Erstelle temporäre Datei
            const fileName = `transcript-${thread.name}-${Date.now()}.html`;
            const filePath = path.join(__dirname, '..', 'temp', fileName);
            
            // Stelle sicher, dass das temp-Verzeichnis existiert
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            // Schreibe Datei
            await fs.writeFile(filePath, html);
            
            // Erstelle Attachment
            const attachment = new AttachmentBuilder(filePath, { name: fileName });
            
            // Cleanup nach kurzer Verzögerung
            setTimeout(async () => {
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    console.error('Fehler beim Löschen der temporären Datei:', error);
                }
            }, 5000);
            
            return attachment;
        } catch (error) {
            console.error('Fehler beim Erstellen des Transkripts:', error);
            return null;
        }
    }

    async fetchAllMessages(thread) {
        const messages = [];
        let lastMessageId;

        while (true) {
            const options = { limit: 100 };
            if (lastMessageId) {
                options.before = lastMessageId;
            }

            const fetchedMessages = await thread.messages.fetch(options);
            
            if (fetchedMessages.size === 0) {
                break;
            }

            messages.push(...fetchedMessages.values());
            lastMessageId = fetchedMessages.last().id;
        }

        // Sortiere Nachrichten chronologisch
        return messages.reverse();
    }

    async generateHTML(thread, messages) {
        const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Transkript - ${thread.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background-color: #36393f;
            color: #dcddde;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #2f3136;
            border-radius: 8px;
            padding: 20px;
        }
        .header {
            background-color: #202225;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #fff;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #b9bbbe;
        }
        .message {
            display: flex;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .message:hover {
            background-color: #32353b;
        }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            background-color: #5865f2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .message-content {
            flex: 1;
        }
        .author {
            font-weight: 600;
            color: #fff;
            margin-bottom: 2px;
        }
        .timestamp {
            font-size: 12px;
            color: #72767d;
            margin-left: 10px;
        }
        .content {
            color: #dcddde;
            word-wrap: break-word;
        }
        .embed {
            background-color: #2f3136;
            border-left: 4px solid #5865f2;
            padding: 10px;
            margin-top: 5px;
            border-radius: 4px;
        }
        .attachment {
            color: #00aff4;
            text-decoration: none;
            display: inline-block;
            margin-top: 5px;
        }
        .system-message {
            color: #72767d;
            font-style: italic;
            text-align: center;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ticket Transkript: ${thread.name}</h1>
            <p>Erstellt am: ${new Date(thread.createdTimestamp).toLocaleString('de-DE')}</p>
            <p>Nachrichten: ${messages.length}</p>
        </div>
        
        <div class="messages">
            ${messages.map(msg => this.formatMessage(msg)).join('')}
        </div>
    </div>
</body>
</html>`;
        return html;
    }

    formatMessage(message) {
        const author = message.author;
        const timestamp = new Date(message.createdTimestamp).toLocaleString('de-DE');
        
        if (message.system) {
            return `<div class="system-message">${message.content}</div>`;
        }

        let content = this.escapeHtml(message.content);
        
        // Formatiere Embeds
        const embeds = message.embeds.map(embed => {
            return `
                <div class="embed">
                    ${embed.title ? `<strong>${this.escapeHtml(embed.title)}</strong><br>` : ''}
                    ${embed.description ? this.escapeHtml(embed.description) : ''}
                </div>
            `;
        }).join('');

        // Formatiere Attachments
        const attachments = message.attachments.map(att => {
            return `<a class="attachment" href="${att.url}" target="_blank">📎 ${att.name}</a>`;
        }).join(' ');

        return `
            <div class="message">
                <div class="avatar">${author.username.charAt(0).toUpperCase()}</div>
                <div class="message-content">
                    <div>
                        <span class="author">${this.escapeHtml(author.username)}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="content">${content}</div>
                    ${embeds}
                    ${attachments}
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

module.exports = new TranscriptGenerator();