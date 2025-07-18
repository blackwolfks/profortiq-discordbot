const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban, client) {
        // Versuche den Executor aus dem Audit Log zu bekommen
        let executor = null;
        try {
            const auditLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_BAN_ADD'
            });
            const banLog = auditLogs.entries.first();
            if (banLog && banLog.target.id === ban.user.id) {
                executor = banLog.executor;
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Audit Logs:', error);
        }

        await client.logger.log('memberBan', {
            user: ban.user,
            reason: ban.reason,
            executor: executor
        });
    }
};