const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const db = require('./database');

class Logger {
    constructor(client) {
        this.client = client;
    }

    async getLogChannel() {
        const channels = db.get('channels') || {};
        const channelId = channels.logChannel || config.channels.logChannel;
        if (!channelId) return null;
        
        try {
            return await this.client.channels.fetch(channelId);
        } catch (error) {
            console.error('Log Channel nicht gefunden:', error);
            return null;
        }
    }

    async log(embed) {
        const logChannel = await this.getLogChannel();
        if (!logChannel) return;
        
        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Fehler beim Senden des Logs:', error);
        }
    }

    // Message Events
    async logMessageDelete(message) {
        if (message.author.bot) return;
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('📝 Nachricht gelöscht')
            .setDescription(`**Autor:** ${message.author.tag} (${message.author.id})
**Channel:** ${message.channel} (${message.channel.id})
**Inhalt:** ${message.content || '*Keine Textinhalte*'}`)
            .setTimestamp()
            .setFooter({ text: 'Message Delete Log' });

        if (message.attachments.size > 0) {
            embed.addFields({ 
                name: 'Anhänge', 
                value: message.attachments.map(a => a.url).join('\n') 
            });
        }

        await this.log(embed);
    }

    async logMessageEdit(oldMessage, newMessage) {
        if (newMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('✏️ Nachricht bearbeitet')
            .setDescription(`**Autor:** ${newMessage.author.tag} (${newMessage.author.id})
**Channel:** ${newMessage.channel} (${newMessage.channel.id})`)
            .addFields(
                { name: 'Vorher', value: oldMessage.content || '*Kein Text*', inline: false },
                { name: 'Nachher', value: newMessage.content || '*Kein Text*', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Message Edit Log' });

        await this.log(embed);
    }

    // Member Events
    async logMemberJoin(member) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('📥 Mitglied beigetreten')
            .setDescription(`**User:** ${member.user.tag} (${member.user.id})
**Account erstellt:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `Mitglieder: ${member.guild.memberCount}` });

        await this.log(embed);
    }

    async logMemberLeave(member) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('📤 Mitglied verlassen')
            .setDescription(`**User:** ${member.user.tag} (${member.user.id})
**Beigetreten:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `Mitglieder: ${member.guild.memberCount}` });

        await this.log(embed);
    }

    async logMemberBan(ban) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🔨 Mitglied gebannt')
            .setDescription(`**User:** ${ban.user.tag} (${ban.user.id})
**Grund:** ${ban.reason || 'Kein Grund angegeben'}`)
            .setThumbnail(ban.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Member Ban Log' });

        await this.log(embed);
    }

    async logMemberUnban(ban) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Ban aufgehoben')
            .setDescription(`**User:** ${ban.user.tag} (${ban.user.id})`)
            .setThumbnail(ban.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Member Unban Log' });

        await this.log(embed);
    }

    // Channel Events
    async logChannelCreate(channel) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('➕ Channel erstellt')
            .setDescription(`**Name:** ${channel.name}
**Typ:** ${channel.type}
**ID:** ${channel.id}`)
            .setTimestamp()
            .setFooter({ text: 'Channel Create Log' });

        await this.log(embed);
    }

    async logChannelDelete(channel) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('➖ Channel gelöscht')
            .setDescription(`**Name:** ${channel.name}
**Typ:** ${channel.type}
**ID:** ${channel.id}`)
            .setTimestamp()
            .setFooter({ text: 'Channel Delete Log' });

        await this.log(embed);
    }

    // Role Events
    async logRoleCreate(role) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🎨 Rolle erstellt')
            .setDescription(`**Name:** ${role.name}
**Farbe:** ${role.hexColor}
**ID:** ${role.id}
**Position:** ${role.position}`)
            .setTimestamp()
            .setFooter({ text: 'Role Create Log' });

        await this.log(embed);
    }

    async logRoleDelete(role) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🗑️ Rolle gelöscht')
            .setDescription(`**Name:** ${role.name}
**Farbe:** ${role.hexColor}
**ID:** ${role.id}`)
            .setTimestamp()
            .setFooter({ text: 'Role Delete Log' });

        await this.log(embed);
    }

    // Ticket Events
    async logTicketCreate(user, thread, category) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🎫 Ticket erstellt')
            .setDescription(`**User:** ${user.tag} (${user.id})
**Ticket:** ${thread.name}
**Kategorie:** ${category}`)
            .setTimestamp()
            .setFooter({ text: 'Ticket Create Log' });

        await this.log(embed);
    }

    async logTicketClaim(ticket, supporter) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🎯 Ticket übernommen')
            .setDescription(`**Ticket:** ${ticket.name}
**Supporter:** ${supporter.tag} (${supporter.id})`)
            .setTimestamp()
            .setFooter({ text: 'Ticket Claim Log' });

        await this.log(embed);
    }

    async logTicketClose(ticket, closedBy) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('🔒 Ticket geschlossen')
            .setDescription(`**Ticket:** ${ticket.name}
**Geschlossen von:** ${closedBy.tag} (${closedBy.id})`)
            .setTimestamp()
            .setFooter({ text: 'Ticket Close Log' });

        await this.log(embed);
    }

    async logTicketDelete(ticketName, deletedBy) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🗑️ Ticket gelöscht')
            .setDescription(`**Ticket:** ${ticketName}
**Gelöscht von:** ${deletedBy.tag} (${deletedBy.id})`)
            .setTimestamp()
            .setFooter({ text: 'Ticket Delete Log' });

        await this.log(embed);
    }
}

module.exports = Logger;