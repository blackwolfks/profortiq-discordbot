const { Events } = require('discord.js');

module.exports = [
    // Message Delete
    {
        name: Events.MessageDelete,
        async execute(message, logger) {
            if (!logger) return;
            await logger.logMessageDelete(message);
        }
    },
    
    // Message Update
    {
        name: Events.MessageUpdate,
        async execute(oldMessage, newMessage, logger) {
            if (!logger) return;
            await logger.logMessageEdit(oldMessage, newMessage);
        }
    },
    
    // Guild Member Add
    {
        name: Events.GuildMemberAdd,
        async execute(member, logger) {
            if (!logger) return;
            await logger.logMemberJoin(member);
        }
    },
    
    // Guild Member Remove
    {
        name: Events.GuildMemberRemove,
        async execute(member, logger) {
            if (!logger) return;
            await logger.logMemberLeave(member);
        }
    },
    
    // Guild Ban Add
    {
        name: Events.GuildBanAdd,
        async execute(ban, logger) {
            if (!logger) return;
            await logger.logMemberBan(ban);
        }
    },
    
    // Guild Ban Remove
    {
        name: Events.GuildBanRemove,
        async execute(ban, logger) {
            if (!logger) return;
            await logger.logMemberUnban(ban);
        }
    },
    
    // Channel Create
    {
        name: Events.ChannelCreate,
        async execute(channel, logger) {
            if (!logger) return;
            await logger.logChannelCreate(channel);
        }
    },
    
    // Channel Delete
    {
        name: Events.ChannelDelete,
        async execute(channel, logger) {
            if (!logger) return;
            await logger.logChannelDelete(channel);
        }
    },
    
    // Role Create
    {
        name: Events.GuildRoleCreate,
        async execute(role, logger) {
            if (!logger) return;
            await logger.logRoleCreate(role);
        }
    },
    
    // Role Delete
    {
        name: Events.GuildRoleDelete,
        async execute(role, logger) {
            if (!logger) return;
            await logger.logRoleDelete(role);
        }
    }
];