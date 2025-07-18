const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        await client.logger.log('memberLeave', {
            user: member.user,
            guild: member.guild,
            roles: member.roles,
            joinedAt: member.joinedAt,
            joinedTimestamp: member.joinedTimestamp
        });
    }
};