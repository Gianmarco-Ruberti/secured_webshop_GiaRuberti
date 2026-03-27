const db = require('../config/db');

module.exports = {

    // ----------------------------------------------------------
    // GET /api/admin/users
    // ----------------------------------------------------------
    getUsers: (_req, res) => {
        db.query('SELECT id, username, email, role, address FROM users', (err, results) => {
            if (err) {
                console.error('Erreur DB:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json(results);
        });
    }
};
