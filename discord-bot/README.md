# Discord Ticket & Logging Bot

Ein fortschrittlicher Discord Bot mit Thread-basiertem Ticket-System und umfassenden Server-Logging-Funktionen.

## 🌟 Features

### 🎫 Thread-basiertes Ticket-System
- **Private Threads** - Tickets werden als private Threads erstellt, sichtbar nur für Ersteller und Support-Team
- **Kategorie-System** - Vordefinierte Kategorien (Technik, Kaufhilfe, Bugs, Sonstiges)
- **Supporter-Panel** - Claim, Close und Delete Funktionen für effiziente Ticket-Verwaltung
- **Automatische Transkripte** - HTML-Transkripte werden bei Schließung erstellt und per DM gesendet
- **Status-Tracking** - Offen, Übernommen, Geschlossen Status mit Datenbank-Speicherung

### 📜 Server Logging System
- **Nachrichtenverwaltung** - Gelöschte und bearbeitete Nachrichten
- **Mitgliederverwaltung** - Beitritte, Austritte, Bans
- **Ticket-Aktionen** - Alle Ticket-bezogenen Aktivitäten
- **Strukturierte Logs** - Übersichtliche Embed-Nachrichten mit allen relevanten Informationen

## 🚀 Installation

### Voraussetzungen
- Node.js v16.9.0 oder höher
- Discord Bot Token
- Discord Server mit Administrator-Rechten

### Schritt-für-Schritt Anleitung

1. **Repository klonen**
```bash
cd discord-bot
```

2. **Dependencies installieren**
```bash
npm install
```

3. **.env Datei konfigurieren**
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
CLIENT_ID=YOUR_CLIENT_ID_HERE
GUILD_ID=YOUR_GUILD_ID_HERE
TICKET_CHANNEL_ID=YOUR_TICKET_CHANNEL_ID
LOG_CHANNEL_ID=1394321346262991019
SUPPORT_ROLE_ID=YOUR_SUPPORT_ROLE_ID  # Optional
```

4. **Bot starten**
```bash
npm start
# oder für Entwicklung mit Auto-Restart:
npm run dev
```

## 📋 Setup im Discord Server

1. **Bot einladen** mit folgenden Berechtigungen:
   - Nachrichten senden/lesen
   - Threads erstellen/verwalten
   - Embeds senden
   - Dateien anhängen
   - Mitglieder verwalten
   - Audit-Log lesen

2. **Channels erstellen:**
   - Einen Channel für Tickets (wird als `TICKET_CHANNEL_ID` verwendet)
   - Einen Channel für Logs (ID: `1394321346262991019` oder anpassen)

3. **Support-Rolle erstellen** (optional):
   - Erstelle eine Rolle für dein Support-Team
   - Füge die Rollen-ID in der .env als `SUPPORT_ROLE_ID` ein

4. **Bot Setup ausführen:**
   - Nutze `/setup` im gewünschten Channel um das Ticket-System zu initialisieren
   - Der Bot erstellt automatisch die Ticket-Nachricht mit Button

## 🎮 Verwendung

### Für Nutzer:
1. Klicke auf "Ticket erstellen" Button
2. Wähle eine Kategorie
3. Beschreibe dein Anliegen im erstellten Thread
4. Warte auf Antwort vom Support-Team

### Für Supporter:
- **🎯 Claim** - Ticket übernehmen und als Bearbeiter markieren
- **🔒 Close** - Ticket schließen und archivieren (Transkript wird erstellt)
- **🗑️ Delete** - Ticket komplett löschen (nur für Supporter)

## 📁 Projektstruktur
```
discord-bot/
├── src/
│   ├── commands/       # Slash Commands
│   ├── events/         # Discord Event Handler
│   └── utils/          # Utilities (DB, Logger, Transcript)
├── config/
│   └── config.js       # Bot-Konfiguration
├── .env                # Umgebungsvariablen
└── package.json        # Dependencies
```

## 🔧 Konfiguration

Die Hauptkonfiguration findest du in `config/config.js`:
- Ticket-Kategorien anpassen
- Farben für Embeds ändern
- Logging-Optionen ein/ausschalten
- Support-Rolle definieren

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.