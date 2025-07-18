const { AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class TicketTranscript {
    static async generateTranscript(thread, ticketData) {
        try {
            // Alle Nachrichten aus dem Thread holen
            const messages = [];
            let lastId;

            while (true) {
                const options = { limit: 100 };
                if (lastId) options.before = lastId;

                const fetchedMessages = await thread.messages.fetch(options);
                if (fetchedMessages.size === 0) break;

                messages.push(...fetchedMessages.values());
                lastId = fetchedMessages.last().id;
            }

            // Nachrichten nach Datum sortieren (älteste zuerst)
            messages.reverse();

            // HTML-Transkript generieren
            const html = await this.generateHTML(messages, ticketData, thread);
            
            // Temporäre Datei erstellen
            const fileName = `ticket-${ticketData.ticketId}-transcript.html`;
            const filePath = path.join(__dirname, '../../temp', fileName);
            
            // Temp-Ordner erstellen falls nicht vorhanden
            await fs.mkdir(path.join(__dirname, '../../temp'), { recursive: true });
            
            // HTML speichern
            await fs.writeFile(filePath, html);
            
            // Attachment erstellen
            const attachment = new AttachmentBuilder(filePath, { name: fileName });
            
            // Cleanup nach kurzer Verzögerung
            setTimeout(async () => {
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    console.error('Fehler beim Löschen der temporären Datei:', error);
                }
            }, 10000);
            
            return attachment;
        } catch (error) {
            console.error('Fehler beim Erstellen des Transkripts:', error);
            return null;
        }
    }

    static async generateHTML(messages, ticketData, thread) {
        const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket ${ticketData.ticketId} - Transkript</title>
    <style>
        body {
            font-family: Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #36393f;
            color: #dcddde;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background-color: #2f3136;
            border-radius: 8px;
            padding: 20px;
        }
        .header {
            border-bottom: 1px solid #202225;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        h1 {
            color: #ffffff;
            margin: 0 0 10px 0;
        }
        .ticket-info {
            font-size: 14px;
            color: #b9bbbe;
        }
        .ticket-info span {
            display: inline-block;
            margin-right: 20px;
        }
        .message {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #40444b;
        }
        .message:last-child {
            border-bottom: none;
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
        .message-header {
            margin-bottom: 5px;
        }
        .author {
            color: #ffffff;
            font-weight: 600;
            margin-right: 10px;
        }
        .timestamp {
            color: #72767d;
            font-size: 12px;
        }
        .content {
            color: #dcddde;
            line-height: 1.375;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .embed {
            background-color: #202225;
            border-left: 4px solid #5865f2;
            border-radius: 4px;
            padding: 10px;
            margin-top: 5px;
        }
        .system-message {
            color: #72767d;
            font-style: italic;
            text-align: center;
            padding: 10px;
            border-bottom: 1px solid #40444b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ticket #${ticketData.ticketId}</h1>
            <div class="ticket-info">
                <span><strong>Kategorie:</strong> ${ticketData.category}</span>
                <span><strong>Erstellt:</strong> ${new Date(ticketData.createdAt).toLocaleString('de-DE')}</span>
                <span><strong>Geschlossen:</strong> ${ticketData.closedAt ? new Date(ticketData.closedAt).toLocaleString('de-DE') : 'Noch offen'}</span>
                <span><strong>Nachrichten:</strong> ${messages.length}</span>
            </div>
        </div>
        <div class="messages">
`;

        // Nachrichten hinzufügen
        for (const message of messages) {
            if (message.system) {
                html += `<div class="system-message">${this.escapeHTML(message.content)}</div>\n`;
            } else {
                const timestamp = new Date(message.createdTimestamp).toLocaleString('de-DE');
                const avatar = message.author.username.charAt(0).toUpperCase();
                
                html += `
            <div class="message">
                <div class="avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="author">${this.escapeHTML(message.author.username)}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="content">${this.escapeHTML(message.content || '')}</div>
`;
                
                // Embeds hinzufügen falls vorhanden
                if (message.embeds.length > 0) {
                    for (const embed of message.embeds) {
                        html += `<div class="embed">`;
                        if (embed.title) html += `<strong>${this.escapeHTML(embed.title)}</strong><br>`;
                        if (embed.description) html += `${this.escapeHTML(embed.description)}<br>`;
                        if (embed.fields) {
                            for (const field of embed.fields) {
                                html += `<br><strong>${this.escapeHTML(field.name)}:</strong> ${this.escapeHTML(field.value)}`;
                            }
                        }
                        html += `</div>`;
                    }
                }
                
                html += `
                </div>
            </div>
`;
            }
        }

        html += `
        </div>
    </div>
</body>
</html>`;

        return html;
    }

    static escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

module.exports = TicketTranscript;