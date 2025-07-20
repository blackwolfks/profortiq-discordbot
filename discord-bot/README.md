# Discord Bot - Thread-basiertes Ticket-System mit Server Logging

Ein fortschrittlicher Discord Bot mit Thread-basiertem Ticket-System und umfangreichem Server-Logging.

## 🚀 Features

### 🎫 Thread-basiertes Ticket-System
- Tickets werden als private Threads erstellt
- Kategorie-Auswahl (Technik, Kaufhilfe, Bugs, Sonstiges)
- Supporter-Panel mit Claim, Close und Delete Funktionen
- Automatische Transkript-Erstellung
- Ticket-Limit pro User

### 📜 Server Logging System
- Nachrichten-Events (Löschen, Bearbeiten)
- Member-Events (Join, Leave, Ban, Unban)
- Channel-Events (Erstellen, Löschen)
- Rollen-Events (Erstellen, Löschen)
- Ticket-Events (Erstellen, Claim, Close, Delete)

## 📦 Installation

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Bot starten:**
   ```bash
   npm start
   ```

3. **Commands deployen:**
   ```bash
   npm run deploy-commands
   ```

## ⚙️ Konfiguration

### Erste Schritte:

1. **Log-Channel setzen:**
   ```
   /setup channels log-channel:#channel
   ```

2. **Ticket-Channel setzen:**
   ```
   /setup channels ticket-channel:#channel
   ```

3. **Support-Rolle setzen:**
   ```
   /setup support-role role:@rolle
   ```

4. **Ticket-Panel erstellen:**
   ```
   /setup ticket-panel channel:#channel
   ```

5. **Konfiguration anzeigen:**
   ```
   /setup show
   ```

## 📁 Struktur

```
discord-bot/
├── commands/          # Slash Commands
├── config/           # Bot-Konfiguration
├── data/            # Persistente Daten
├── events/          # Event Handler
├── temp/            # Temporäre Dateien
├── utils/           # Utility Module
├── .env             # Umgebungsvariablen
├── index.js         # Haupt-Bot-Datei
└── package.json     # Dependencies
```

## 🔒 Sicherheit

- Der Bot-Token ist in der `.env` Datei gespeichert
- Die `.env` Datei ist in `.gitignore` aufgeführt
- Niemals den Token öffentlich teilen!

## 🛠️ Befehle

### Admin-Befehle:
- `/setup channels` - Kanäle konfigurieren
- `/setup support-role` - Support-Rolle setzen
- `/setup ticket-panel` - Ticket-Panel erstellen
- `/setup show` - Aktuelle Konfiguration anzeigen

## 📝 Hinweise

- Der Bot benötigt die folgenden Berechtigungen:
  - Nachrichten senden/lesen
  - Threads erstellen/verwalten
  - Embeds senden
  - Dateien anhängen
  - Reaktionen hinzufügen
  - Mitglieder verwalten (für Ticket-Zugriff)

- Stelle sicher, dass der Bot eine höhere Rolle als die zu verwaltenden Mitglieder hat