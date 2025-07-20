const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Konfiguriere den Bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Setze die Bot-Kanäle')
                .addChannelOption(option =>
                    option
                        .setName('log-channel')
                        .setDescription('Kanal für Server-Logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addChannelOption(option =>
                    option
                        .setName('ticket-channel')
                        .setDescription('Kanal für Tickets')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addChannelOption(option =>
                    option
                        .setName('ticket-archive')
                        .setDescription('Kanal für Ticket-Archive')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('support-role')
                .setDescription('Setze die Support-Team Rolle')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Die Support-Team Rolle')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticket-panel')
                .setDescription('Erstelle ein Ticket-Panel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Kanal für das Ticket-Panel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Zeige die aktuelle Konfiguration')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'channels':
                await this.setupChannels(interaction);
                break;
            case 'support-role':
                await this.setupSupportRole(interaction);
                break;
            case 'ticket-panel':
                await this.setupTicketPanel(interaction);
                break;
            case 'show':
                await this.showConfig(interaction);
                break;
        }
    },

    async setupChannels(interaction) {
        const logChannel = interaction.options.getChannel('log-channel');
        const ticketChannel = interaction.options.getChannel('ticket-channel');
        const ticketArchive = interaction.options.getChannel('ticket-archive');

        const channels = db.get('channels') || {};
        let updated = [];

        if (logChannel) {
            channels.logChannel = logChannel.id;
            updated.push(`Log-Channel: ${logChannel}`);
        }
        if (ticketChannel) {
            channels.ticketChannel = ticketChannel.id;
            updated.push(`Ticket-Channel: ${ticketChannel}`);
        }
        if (ticketArchive) {
            channels.ticketArchive = ticketArchive.id;
            updated.push(`Ticket-Archiv: ${ticketArchive}`);
        }

        if (updated.length > 0) {
            db.set('channels', channels);
            await interaction.reply({
                content: `✅ Folgende Kanäle wurden konfiguriert:\n${updated.join('\n')}`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ Bitte wähle mindestens einen Kanal aus!',
                ephemeral: true
            });
        }
    },

    async setupSupportRole(interaction) {
        const role = interaction.options.getRole('role');
        
        db.set('supportRole', role.id);
        
        await interaction.reply({
            content: `✅ Support-Team Rolle wurde auf ${role} gesetzt!`,
            ephemeral: true
        });
    },

    async setupTicketPanel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const config = require('../config/config');

        // Prüfe ob Ticket-Channel gesetzt ist
        const channels = db.get('channels') || {};
        if (!channels.ticketChannel) {
            return await interaction.reply({
                content: '❌ Bitte setze zuerst einen Ticket-Channel mit `/setup channels`!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Ticket System')
            .setDescription(`Benötigst du Hilfe? Erstelle ein Ticket!

**So funktioniert's:**
1. Klicke auf den Button unten
2. Wähle eine Kategorie aus
3. Beschreibe dein Anliegen
4. Warte auf einen Supporter

**Ticket-Kategorien:**
${config.ticketCategories.map(cat => `${cat.emoji} **${cat.name}**`).join('\n')}`)
            .setColor(config.colors.primary)
            .setFooter({ text: 'Ticket System • Missbrauch wird bestraft' });

        const button = new ButtonBuilder()
            .setCustomId('create-ticket')
            .setLabel('Ticket erstellen')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        try {
            const message = await channel.send({
                embeds: [embed],
                components: [row]
            });

            db.set('ticketPanelMessage', {
                channelId: channel.id,
                messageId: message.id
            });

            await interaction.reply({
                content: `✅ Ticket-Panel wurde in ${channel} erstellt!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Fehler beim Erstellen des Ticket-Panels:', error);
            await interaction.reply({
                content: '❌ Fehler beim Erstellen des Ticket-Panels!',
                ephemeral: true
            });
        }
    },

    async showConfig(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config/config');
        
        const channels = db.get('channels') || {};
        const supportRole = db.get('supportRole');
        const ticketPanel = db.get('ticketPanelMessage');

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Bot Konfiguration')
            .setColor(config.colors.info)
            .addFields(
                { 
                    name: '📝 Log-Channel', 
                    value: channels.logChannel ? `<#${channels.logChannel}>` : '❌ Nicht gesetzt',
                    inline: true
                },
                { 
                    name: '🎫 Ticket-Channel', 
                    value: channels.ticketChannel ? `<#${channels.ticketChannel}>` : '❌ Nicht gesetzt',
                    inline: true
                },
                { 
                    name: '📁 Ticket-Archiv', 
                    value: channels.ticketArchive ? `<#${channels.ticketArchive}>` : '❌ Nicht gesetzt',
                    inline: true
                },
                { 
                    name: '👥 Support-Rolle', 
                    value: supportRole ? `<@&${supportRole}>` : '❌ Nicht gesetzt',
                    inline: true
                },
                { 
                    name: '📋 Ticket-Panel', 
                    value: ticketPanel ? `✅ Aktiv in <#${ticketPanel.channelId}>` : '❌ Nicht erstellt',
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};