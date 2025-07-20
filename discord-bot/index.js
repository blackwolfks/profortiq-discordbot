const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const Logger = require('./utils/logger');

// Erstelle einen neuen Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.ThreadMember
    ]
});

// Initialisiere Logger
const logger = new Logger(client);

// Command Collection
client.commands = new Collection();

// Lade Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.log(`⚠️  Der Command in ${filePath} fehlt eine erforderliche "data" oder "execute" Eigenschaft.`);
    }
}

// Lade Events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const eventModule = require(filePath);
    
    // Handle sowohl einzelne Events als auch Event-Arrays
    const events = Array.isArray(eventModule) ? eventModule : [eventModule];
    
    for (const event of events) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, logger));
        } else {
            client.on(event.name, (...args) => event.execute(...args, logger));
        }
        console.log(`✅ Loaded event: ${event.name}`);
    }
}

// Ready Event
client.once('ready', () => {
    console.log(`✅ Bot ist online als ${client.user.tag}!`);
    console.log(`📊 Auf ${client.guilds.cache.size} Servern`);
    
    // Setze Bot-Status
    client.user.setActivity('Tickets verwalten', { type: 'WATCHING' });
});

// Interaction Handler
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            console.error(`Kein Command mit dem Namen ${interaction.commandName} gefunden.`);
            return;
        }
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Fehler beim Ausführen von ${interaction.commandName}:`, error);
            
            const errorMessage = {
                content: '❌ Es gab einen Fehler beim Ausführen dieses Commands!',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
});

// Error Handling
client.on('error', error => {
    console.error('Discord Client Error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Promise Rejection:', error);
});

// Login
client.login(config.token).catch(error => {
    console.error('Fehler beim Login:', error);
    process.exit(1);
});