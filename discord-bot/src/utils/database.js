const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// SQLite Datenbank initialisieren
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
});

// Ticket Model
const Ticket = sequelize.define('Ticket', {
    ticketId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    threadId: {
        type: DataTypes.STRING,
        unique: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    claimedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('open', 'claimed', 'closed'),
        defaultValue: 'open'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    closedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

// Datenbank initialisieren
async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Datenbankverbindung erfolgreich hergestellt.');
        
        await sequelize.sync();
        console.log('Datenbank-Tabellen wurden erstellt.');
    } catch (error) {
        console.error('Fehler beim Verbinden mit der Datenbank:', error);
    }
}

module.exports = {
    sequelize,
    Ticket,
    initDatabase
};