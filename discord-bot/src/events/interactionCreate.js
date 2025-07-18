const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const config = require('../../config/config');
const { Ticket } = require('../utils/database');
const TicketTranscript = require('../utils/ticketTranscript');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ 
                    content: 'Es gab einen Fehler beim Ausführen dieses Commands!', 
                    ephemeral: true 
                });
            }
        }
        
        // Button Interactions
        else if (interaction.isButton()) {
            // Ticket erstellen
            if (interaction.customId === 'create_ticket') {
                // Prüfen ob User bereits ein offenes Ticket hat
                const existingTicket = await Ticket.findOne({
                    where: { 
                        userId: interaction.user.id,
                        status: ['open', 'claimed']
                    }
                });

                if (existingTicket) {
                    return await interaction.reply({
                        content: `Du hast bereits ein offenes Ticket! <#${existingTicket.threadId}>`,
                        ephemeral: true
                    });
                }

                // Kategorie-Auswahl anzeigen
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('ticket_category')
                    .setPlaceholder('Wähle eine Kategorie')
                    .addOptions(config.ticketCategories);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.reply({
                    content: 'Bitte wähle eine Kategorie für dein Ticket:',
                    components: [row],
                    ephemeral: true
                });
            }
            
            // Ticket claimen
            else if (interaction.customId === 'claim_ticket') {
                const ticket = await Ticket.findOne({ where: { threadId: interaction.channel.id } });
                if (!ticket) return;

                if (ticket.claimedBy) {
                    return await interaction.reply({
                        content: 'Dieses Ticket wurde bereits übernommen!',
                        ephemeral: true
                    });
                }

                // Prüfen ob User Supporter ist
                if (config.supportRoleId && !interaction.member.roles.cache.has(config.supportRoleId)) {
                    return await interaction.reply({
                        content: 'Du hast keine Berechtigung, Tickets zu übernehmen!',
                        ephemeral: true
                    });
                }

                // Ticket claimen
                ticket.claimedBy = interaction.user.id;
                ticket.status = 'claimed';
                await ticket.save();

                // Thread-Name aktualisieren
                await interaction.channel.setName(`🎯-${ticket.category}-${ticket.ticketId}`);

                // Embed aktualisieren
                const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    .addFields({ name: '🎯 Übernommen von', value: `<@${interaction.user.id}>`, inline: true });

                await interaction.message.edit({ embeds: [embed] });
                
                await interaction.reply({
                    content: `Ticket wurde von <@${interaction.user.id}> übernommen!`
                });

                // Log
                await client.logger.log('ticketClaim', {
                    ticketId: ticket.ticketId,
                    claimedBy: interaction.user.id,
                    threadId: ticket.threadId
                });
            }
            
            // Ticket schließen
            else if (interaction.customId === 'close_ticket') {
                const ticket = await Ticket.findOne({ where: { threadId: interaction.channel.id } });
                if (!ticket) return;

                // Prüfen ob User berechtigt ist
                const isSupporter = config.supportRoleId && interaction.member.roles.cache.has(config.supportRoleId);
                const isCreator = ticket.userId === interaction.user.id;

                if (!isSupporter && !isCreator) {
                    return await interaction.reply({
                        content: 'Du hast keine Berechtigung, dieses Ticket zu schließen!',
                        ephemeral: true
                    });
                }

                await interaction.deferReply();

                // Transkript erstellen
                const transcript = await TicketTranscript.generateTranscript(interaction.channel, ticket);
                
                // Ticket in DB aktualisieren
                ticket.status = 'closed';
                ticket.closedAt = new Date();
                await ticket.save();

                // Thread archivieren
                await interaction.channel.setArchived(true);
                await interaction.channel.setLocked(true);

                // DM an Ticket-Ersteller
                try {
                    const user = await client.users.fetch(ticket.userId);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('Ticket geschlossen')
                        .setDescription(`Dein Ticket **#${ticket.ticketId}** wurde geschlossen.`)
                        .setColor(config.colors.warning)
                        .addFields(
                            { name: 'Kategorie', value: ticket.category, inline: true },
                            { name: 'Geschlossen von', value: `<@${interaction.user.id}>`, inline: true }
                        )
                        .setTimestamp();

                    if (transcript) {
                        await user.send({ embeds: [dmEmbed], files: [transcript] });
                    } else {
                        await user.send({ embeds: [dmEmbed] });
                    }
                } catch (error) {
                    console.error('Konnte DM nicht senden:', error);
                }

                // Log
                const duration = ticket.createdAt ? 
                    `${Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 1000 / 60)} Minuten` : 
                    'Unbekannt';

                await client.logger.log('ticketClose', {
                    ticketId: ticket.ticketId,
                    closedBy: interaction.user.id,
                    duration: duration
                });

                await interaction.editReply('Ticket wurde geschlossen und archiviert!');
            }
            
            // Ticket löschen
            else if (interaction.customId === 'delete_ticket') {
                const ticket = await Ticket.findOne({ where: { threadId: interaction.channel.id } });
                if (!ticket) return;

                // Nur Supporter können löschen
                if (!config.supportRoleId || !interaction.member.roles.cache.has(config.supportRoleId)) {
                    return await interaction.reply({
                        content: 'Du hast keine Berechtigung, Tickets zu löschen!',
                        ephemeral: true
                    });
                }

                await interaction.reply('Ticket wird gelöscht...');

                // Log
                await client.logger.log('ticketDelete', {
                    ticketId: ticket.ticketId,
                    deletedBy: interaction.user.id
                });

                // Aus DB löschen
                await ticket.destroy();

                // Thread löschen
                await interaction.channel.delete();
            }
        }
        
        // Select Menu Interactions
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_category') {
                const category = interaction.values[0];
                const categoryData = config.ticketCategories.find(c => c.value === category);

                // Ticket-ID generieren
                const ticketCount = await Ticket.count() + 1;
                const ticketId = String(ticketCount).padStart(4, '0');

                // Thread im Ticket-Channel erstellen
                const ticketChannel = await client.channels.fetch(config.ticketChannelId);
                
                const thread = await ticketChannel.threads.create({
                    name: `${categoryData.emoji}-${category}-${ticketId}`,
                    type: ChannelType.PrivateThread,
                    invitable: false,
                    reason: `Ticket #${ticketId} erstellt von ${interaction.user.tag}`
                });

                // Thread-Berechtigungen setzen
                await thread.members.add(interaction.user.id);

                // Ticket in DB speichern
                await Ticket.create({
                    ticketId: ticketId,
                    threadId: thread.id,
                    userId: interaction.user.id,
                    category: category
                });

                // Willkommens-Embed
                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`Ticket #${ticketId}`)
                    .setDescription(
                        `Willkommen zu deinem Support-Ticket, <@${interaction.user.id}>!\n\n` +
                        `**Kategorie:** ${categoryData.label}\n` +
                        `**Status:** 🟢 Offen\n\n` +
                        `Bitte beschreibe dein Anliegen so detailliert wie möglich. ` +
                        `Ein Teammitglied wird sich so schnell wie möglich bei dir melden.`
                    )
                    .setColor(config.colors.primary)
                    .addFields(
                        { name: 'Erstellt von', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Erstellt am', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                    );

                // Buttons für Supporter
                const supporterRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('claim_ticket')
                            .setLabel('Übernehmen')
                            .setEmoji('🎯')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Schließen')
                            .setEmoji('🔒')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('delete_ticket')
                            .setLabel('Löschen')
                            .setEmoji('🗑️')
                            .setStyle(ButtonStyle.Danger)
                    );

                await thread.send({ 
                    content: config.supportRoleId ? `<@&${config.supportRoleId}>` : null,
                    embeds: [welcomeEmbed], 
                    components: [supporterRow] 
                });

                // Bestätigung an User
                await interaction.update({
                    content: `Dein Ticket wurde erstellt! <#${thread.id}>`,
                    components: [],
                    ephemeral: true
                });

                // Log
                await client.logger.log('ticketCreate', {
                    ticketId: ticketId,
                    userId: interaction.user.id,
                    category: category,
                    threadId: thread.id
                });
            }
        }
    }
};