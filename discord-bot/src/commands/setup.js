const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Richtet das Ticket-System ein')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Ticket-Embed erstellen
        const ticketEmbed = new EmbedBuilder()
            .setTitle('🎫 Support Ticket System')
            .setDescription(
                '**Brauchst du Hilfe?**\n\n' +
                'Klicke auf den Button unten, um ein Support-Ticket zu erstellen.\n' +
                'Ein Teammitglied wird sich so schnell wie möglich um dein Anliegen kümmern.\n\n' +
                '**Bitte beachte:**\n' +
                '• Erstelle nur ein Ticket, wenn du wirklich Hilfe benötigst\n' +
                '• Beschreibe dein Problem so genau wie möglich\n' +
                '• Hab etwas Geduld - wir antworten so schnell wie möglich'
            )
            .setColor(config.colors.primary)
            .setFooter({ text: 'Ticket System' });

        // Button erstellen
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Ticket erstellen')
                    .setEmoji('🎫')
                    .setStyle(ButtonStyle.Primary)
            );

        // Nachricht senden
        await interaction.reply({
            content: 'Setup abgeschlossen! Die Ticket-Nachricht wurde erstellt.',
            ephemeral: true
        });

        await interaction.channel.send({
            embeds: [ticketEmbed],
            components: [row]
        });
    }
};