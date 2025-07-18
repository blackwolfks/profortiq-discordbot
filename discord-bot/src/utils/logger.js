const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

class Logger {
    constructor(client) {
        this.client = client;
        this.logChannel = null;
    }

    async init() {
        try {
            this.logChannel = await this.client.channels.fetch(config.logChannelId);
            console.log('Logger initialisiert. Log-Channel gefunden.');
        } catch (error) {
            console.error('Fehler beim Initialisieren des Loggers:', error);
        }
    }

    async log(type, data) {
        if (!this.logChannel || !config.logging[type]) return;

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: `Log Type: ${type}` });

        switch (type) {
            case 'messageDelete':
                embed
                    .setTitle('📝 Nachricht gelöscht')
                    .setColor(config.colors.warning)
                    .addFields(
                        { name: 'Autor', value: `${data.author.tag} (${data.author.id})`, inline: true },
                        { name: 'Channel', value: `<#${data.channel.id}>`, inline: true },
                        { name: 'Inhalt', value: data.content || '*Kein Textinhalt*' }
                    );
                break;

            case 'messageEdit':
                embed
                    .setTitle('✏️ Nachricht bearbeitet')
                    .setColor(config.colors.info)
                    .addFields(
                        { name: 'Autor', value: `${data.author.tag} (${data.author.id})`, inline: true },
                        { name: 'Channel', value: `<#${data.channel.id}>`, inline: true },
                        { name: 'Vorher', value: data.oldContent || '*Kein Textinhalt*' },
                        { name: 'Nachher', value: data.newContent || '*Kein Textinhalt*' }
                    );
                break;

            case 'memberJoin':
                embed
                    .setTitle('📥 Mitglied beigetreten')
                    .setColor(config.colors.success)
                    .setThumbnail(data.user.displayAvatarURL())
                    .addFields(
                        { name: 'Mitglied', value: `${data.user.tag} (${data.user.id})` },
                        { name: 'Account erstellt', value: `<t:${Math.floor(data.user.createdTimestamp / 1000)}:R>`, inline: true },
                        { name: 'Mitgliederzahl', value: `${data.guild.memberCount}`, inline: true }
                    );
                break;

            case 'memberLeave':
                embed
                    .setTitle('📤 Mitglied verlassen')
                    .setColor(config.colors.error)
                    .setThumbnail(data.user.displayAvatarURL())
                    .addFields(
                        { name: 'Mitglied', value: `${data.user.tag} (${data.user.id})` },
                        { name: 'Beigetreten', value: data.joinedAt ? `<t:${Math.floor(data.joinedTimestamp / 1000)}:R>` : 'Unbekannt' },
                        { name: 'Rollen', value: data.roles.cache.filter(r => r.id !== data.guild.id).map(r => r.toString()).join(', ') || 'Keine' }
                    );
                break;

            case 'memberBan':
                embed
                    .setTitle('🔨 Mitglied gebannt')
                    .setColor(config.colors.error)
                    .addFields(
                        { name: 'Mitglied', value: `${data.user.tag} (${data.user.id})` },
                        { name: 'Moderator', value: data.executor ? `${data.executor.tag}` : 'Unbekannt' },
                        { name: 'Grund', value: data.reason || 'Kein Grund angegeben' }
                    );
                break;

            case 'ticketCreate':
                embed
                    .setTitle('🎫 Ticket erstellt')
                    .setColor(config.colors.primary)
                    .addFields(
                        { name: 'Ersteller', value: `<@${data.userId}> (${data.userId})` },
                        { name: 'Kategorie', value: data.category },
                        { name: 'Ticket ID', value: data.ticketId },
                        { name: 'Thread', value: `<#${data.threadId}>` }
                    );
                break;

            case 'ticketClaim':
                embed
                    .setTitle('🎯 Ticket übernommen')
                    .setColor(config.colors.info)
                    .addFields(
                        { name: 'Ticket ID', value: data.ticketId },
                        { name: 'Übernommen von', value: `<@${data.claimedBy}>` },
                        { name: 'Thread', value: `<#${data.threadId}>` }
                    );
                break;

            case 'ticketClose':
                embed
                    .setTitle('🔒 Ticket geschlossen')
                    .setColor(config.colors.warning)
                    .addFields(
                        { name: 'Ticket ID', value: data.ticketId },
                        { name: 'Geschlossen von', value: `<@${data.closedBy}>` },
                        { name: 'Dauer', value: data.duration || 'Unbekannt' }
                    );
                break;

            case 'ticketDelete':
                embed
                    .setTitle('🗑️ Ticket gelöscht')
                    .setColor(config.colors.error)
                    .addFields(
                        { name: 'Ticket ID', value: data.ticketId },
                        { name: 'Gelöscht von', value: `<@${data.deletedBy}>` }
                    );
                break;

            default:
                return;
        }

        try {
            await this.logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Fehler beim Senden des Logs:', error);
        }
    }
}

module.exports = Logger;