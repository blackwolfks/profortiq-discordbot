const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'settings.json');
        this.ensureDatabase();
    }

    ensureDatabase() {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dbPath)) {
            this.save({
                channels: {
                    logChannel: null,
                    ticketChannel: null,
                    ticketArchive: null
                },
                supportRole: null,
                ticketPanelMessage: null,
                tickets: {},
                activeTickets: {}
            });
        }
    }

    load() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Fehler beim Laden der Datenbank:', error);
            return {};
        }
    }

    save(data) {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Datenbank:', error);
            return false;
        }
    }

    get(key) {
        const data = this.load();
        return data[key];
    }

    set(key, value) {
        const data = this.load();
        data[key] = value;
        return this.save(data);
    }

    update(key, updates) {
        const data = this.load();
        if (!data[key]) data[key] = {};
        Object.assign(data[key], updates);
        return this.save(data);
    }

    // Ticket-spezifische Methoden
    createTicket(userId, ticketData) {
        const data = this.load();
        if (!data.tickets) data.tickets = {};
        if (!data.activeTickets) data.activeTickets = {};
        
        const ticketId = Date.now().toString();
        data.tickets[ticketId] = {
            ...ticketData,
            userId,
            createdAt: new Date().toISOString(),
            status: 'open'
        };
        
        if (!data.activeTickets[userId]) data.activeTickets[userId] = [];
        data.activeTickets[userId].push(ticketId);
        
        this.save(data);
        return ticketId;
    }

    getActiveTickets(userId) {
        const data = this.load();
        return data.activeTickets?.[userId] || [];
    }

    closeTicket(ticketId) {
        const data = this.load();
        if (data.tickets?.[ticketId]) {
            data.tickets[ticketId].status = 'closed';
            data.tickets[ticketId].closedAt = new Date().toISOString();
            
            // Entferne aus activeTickets
            const userId = data.tickets[ticketId].userId;
            if (data.activeTickets?.[userId]) {
                data.activeTickets[userId] = data.activeTickets[userId].filter(id => id !== ticketId);
            }
            
            return this.save(data);
        }
        return false;
    }
}

module.exports = new Database();