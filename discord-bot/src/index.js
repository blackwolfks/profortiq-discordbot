const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { initDatabase } = require('./utils/database');

// Bot Client erstellen mit benötigten Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Collections für Commands
client.commands = new Collection();

// Command Files laden
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] Der Command ${filePath} fehlt eine "data" oder "execute" property.`);
    }
}

// Event Files laden
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Commands registrieren
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log(`Starte das Aktualisieren von ${commands.length} application (/) commands.`);
        
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );
        
        console.log(`Erfolgreich ${commands.length} application (/) commands aktualisiert.`);
    } catch (error) {
        console.error(error);
    }
})();

// Datenbank initialisieren
initDatabase();

// Bot einloggen
client.login(config.token);