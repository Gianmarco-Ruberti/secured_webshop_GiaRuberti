const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/security.log');

// Crée le dossier logs s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, '../logs'))) {
    fs.mkdirSync(path.join(__dirname, '../logs'));
}

module.exports = {
    info: (action, message, details = {}) => write('INFO', action, message, details),
    warn: (action, message, details = {}) => write('WARN', action, message, details),
    error: (action, message, details = {}) => write('ERROR', action, message, details)
};

function write(level, action, message, details) {
    // Sécurité : on s'assure qu'aucun mot de passe ne passe par ici
    const cleanDetails = JSON.parse(JSON.stringify(details));
    delete cleanDetails.password; 
    delete cleanDetails.passwordConfirm;

    const entry = `[${new Date().toISOString()}] [${level}] [${action}] ${message} | Details: ${JSON.stringify(cleanDetails)}\n`;
    fs.appendFileSync(logFile, entry);
}