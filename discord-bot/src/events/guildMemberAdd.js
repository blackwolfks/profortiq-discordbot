const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        await client.logger.log('memberJoin', {
            user: member.user,
            guild: member.guild,
            joinedTimestamp: member.joinedTimestamp
        });
    }
};