const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config/config');
const db = require('../utils/database');
const transcript = require('../utils/transcript');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, logger) {
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction, logger);
        } else if (interaction.isStringSelectMenu()) {
            await handleSelectMenuInteraction(interaction, logger);
        }
    }
};

async function handleButtonInteraction(interaction, logger) {
    const { customId } = interaction;

    switch (customId) {
        case 'create-ticket':
            await handleCreateTicket(interaction);
            break;
        case 'claim-ticket':
            await handleClaimTicket(interaction, logger);
            break;
        case 'close-ticket':
            await handleCloseTicket(interaction, logger);
            break;
        case 'delete-ticket':
            await handleDeleteTicket(interaction, logger);
            break;
    }
}

async function handleCreateTicket(interaction) {
    // Prüfe ob User bereits zu viele Tickets hat
    const activeTickets = db.getActiveTickets(interaction.user.id);
    if (activeTickets.length >= config.ticketSettings.maxTicketsPerUser) {
        return await interaction.reply({
            content: `❌ Du hast bereits ${config.ticketSettings.maxTicketsPerUser} offene Tickets! Bitte schließe zuerst ein Ticket.`,
            ephemeral: true
        });
    }

    // Erstelle Kategorie-Auswahl
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket-category')
        .setPlaceholder('Wähle eine Kategorie')
        .addOptions(config.ticketCategories.map(cat => ({
            label: cat.name,
            description: `${cat.emoji} ${cat.name} Support`,
            value: cat.value,
            emoji: cat.emoji
        })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: '📋 Bitte wähle eine Kategorie für dein Ticket:',
        components: [row],
        ephemeral: true
    });
}

async function handleSelectMenuInteraction(interaction, logger) {
    if (interaction.customId !== 'ticket-category') return;

    const category = interaction.values[0];
    const categoryData = config.ticketCategories.find(cat => cat.value === category);
    
    // Hole Ticket-Channel
    const channels = db.get('channels') || {};
    const ticketChannelId = channels.ticketChannel;
    
    if (!ticketChannelId) {
        return await interaction.update({
            content: '❌ Ticket-Channel wurde noch nicht konfiguriert!',
            components: []
        });
    }

    const ticketChannel = await interaction.guild.channels.fetch(ticketChannelId);
    if (!ticketChannel) {
        return await interaction.update({
            content: '❌ Ticket-Channel konnte nicht gefunden werden!',
            components: []
        });
    }

    try {
        // Erstelle Thread
        const ticketName = `${categoryData.emoji}-ticket-${interaction.user.username}`;
        const thread = await ticketChannel.threads.create({
            name: ticketName,
            autoArchiveDuration: 1440, // 24 Stunden
            type: ChannelType.PrivateThread,
            reason: `Ticket erstellt von ${interaction.user.tag}`
        });

        // Füge User und Support-Team hinzu
        await thread.members.add(interaction.user.id);
        
        const supportRoleId = db.get('supportRole');
        if (supportRoleId) {
            const supportRole = await interaction.guild.roles.fetch(supportRoleId);
            if (supportRole) {
                // Füge alle Mitglieder mit Support-Rolle hinzu
                const supportMembers = supportRole.members;
                for (const [memberId, member] of supportMembers) {
                    try {
                        await thread.members.add(memberId);
                    } catch (error) {
                        console.error(`Konnte Support-Mitglied ${member.user.tag} nicht hinzufügen:`, error);
                    }
                }
            }
        }

        // Erstelle Ticket in Datenbank
        const ticketId = db.createTicket(interaction.user.id, {
            threadId: thread.id,
            category: category,
            categoryName: categoryData.name
        });

        // Erstelle Willkommens-Embed
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${categoryData.emoji} ${categoryData.name} Ticket`)
            .setDescription(`Willkommen ${interaction.user}!

**Ticket-ID:** #${ticketId}
**Kategorie:** ${categoryData.name}
**Erstellt von:** ${interaction.user.tag}

Bitte beschreibe dein Anliegen so detailliert wie möglich. Ein Supporter wird sich schnellstmöglich um dich kümmern!`)
            .setColor(config.colors.primary)
            .setTimestamp();

        // Erstelle Buttons für Supporter
        const supportButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim-ticket')
                    .setLabel('Ticket übernehmen')
                    .setEmoji('🎯')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('close-ticket')
                    .setLabel('Ticket schließen')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('delete-ticket')
                    .setLabel('Ticket löschen')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );

        await thread.send({
            content: `${interaction.user} ${supportRoleId ? `<@&${supportRoleId}>` : ''}`,
            embeds: [welcomeEmbed],
            components: [supportButtons]
        });

        await interaction.update({
            content: `✅ Dein Ticket wurde erstellt: ${thread}`,
            components: []
        });

        // Logge Ticket-Erstellung
        if (logger) {
            await logger.logTicketCreate(interaction.user, thread, categoryData.name);
        }

    } catch (error) {
        console.error('Fehler beim Erstellen des Tickets:', error);
        await interaction.update({
            content: '❌ Fehler beim Erstellen des Tickets!',
            components: []
        });
    }
}

async function handleClaimTicket(interaction, logger) {
    // Prüfe ob User Support-Rolle hat
    const supportRoleId = db.get('supportRole');
    if (supportRoleId && !interaction.member.roles.cache.has(supportRoleId)) {
        return await interaction.reply({
            content: '❌ Nur Supporter können Tickets übernehmen!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`🎯 Ticket wurde von ${interaction.user} übernommen!`)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Logge Ticket-Claim
    if (logger) {
        await logger.logTicketClaim(interaction.channel, interaction.user);
    }
}

async function handleCloseTicket(interaction, logger) {
    const thread = interaction.channel;
    
    // Prüfe ob es ein Ticket-Thread ist
    if (!thread.isThread() || thread.parentId !== db.get('channels')?.ticketChannel) {
        return await interaction.reply({
            content: '❌ Dies ist kein Ticket-Channel!',
            ephemeral: true
        });
    }

    // Erstelle Bestätigungs-Embed
    const confirmEmbed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('🔒 Ticket schließen?')
        .setDescription('Bist du sicher, dass du dieses Ticket schließen möchtest?')
        .setTimestamp();

    await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
    });

    // Generiere Transkript
    if (config.ticketSettings.transcriptEnabled) {
        const transcriptAttachment = await transcript.generateTranscript(thread);
        
        if (transcriptAttachment) {
            // Sende Transkript
            const transcriptEmbed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('📄 Ticket Transkript')
                .setDescription('Das Transkript dieses Tickets wurde erstellt.')
                .setTimestamp();

            // Sende an User per DM
            if (config.ticketSettings.dmTranscript) {
                try {
                    const ticketData = Object.values(db.get('tickets') || {}).find(t => t.threadId === thread.id);
                    if (ticketData) {
                        const user = await interaction.client.users.fetch(ticketData.userId);
                        await user.send({
                            embeds: [transcriptEmbed],
                            files: [transcriptAttachment]
                        });
                    }
                } catch (error) {
                    console.error('Fehler beim Senden des Transkripts per DM:', error);
                }
            }

            // Sende an Archiv-Channel
            const archiveChannelId = db.get('channels')?.ticketArchive;
            if (archiveChannelId) {
                try {
                    const archiveChannel = await interaction.guild.channels.fetch(archiveChannelId);
                    await archiveChannel.send({
                        embeds: [transcriptEmbed],
                        files: [transcriptAttachment]
                    });
                } catch (error) {
                    console.error('Fehler beim Senden des Transkripts an Archiv:', error);
                }
            }
        }
    }

    // Schließe Thread
    await thread.setArchived(true);
    await thread.setLocked(true);

    // Update Datenbank
    const ticketData = Object.entries(db.get('tickets') || {}).find(([_, t]) => t.threadId === thread.id);
    if (ticketData) {
        db.closeTicket(ticketData[0]);
    }

    // Logge Ticket-Schließung
    if (logger) {
        await logger.logTicketClose(thread, interaction.user);
    }
}

async function handleDeleteTicket(interaction, logger) {
    const thread = interaction.channel;
    
    // Prüfe ob User Support-Rolle hat
    const supportRoleId = db.get('supportRole');
    if (supportRoleId && !interaction.member.roles.cache.has(supportRoleId)) {
        return await interaction.reply({
            content: '❌ Nur Supporter können Tickets löschen!',
            ephemeral: true
        });
    }

    // Prüfe ob es ein Ticket-Thread ist
    if (!thread.isThread() || thread.parentId !== db.get('channels')?.ticketChannel) {
        return await interaction.reply({
            content: '❌ Dies ist kein Ticket-Channel!',
            ephemeral: true
        });
    }

    await interaction.reply({
        content: '🗑️ Ticket wird gelöscht...',
        ephemeral: true
    });

    const ticketName = thread.name;

    // Lösche Thread
    await thread.delete();

    // Logge Ticket-Löschung
    if (logger) {
        await logger.logTicketDelete(ticketName, interaction.user);
    }
}