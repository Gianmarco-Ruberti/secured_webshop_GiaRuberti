const db = require('../config/db');
const securityUtils = require('../utils/security');

module.exports = {

    // ----------------------------------------------------------
    // POST /api/auth/login
    // Utilise des requêtes paramétrées et JWT
    // ----------------------------------------------------------
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email et mot de passe requis' });
            }

            // Utiliser une requête paramétrée pour éviter l'injection SQL
            const query = 'SELECT id, username, email, password, role FROM users WHERE email = ?';
            
            db.query(query, [email], async (err, results) => {
                if (err) {
                    console.error('Erreur DB:', err);
                    return res.status(500).json({ error: 'Erreur serveur' });
                }

                if (results.length === 0) {
                    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
                }

                const user = results[0];

                try {
                    // Comparer le mot de passe avec le hash
                    const isPasswordValid = await securityUtils.comparePassword(password, user.password);

                    if (!isPasswordValid) {
                        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
                    }

                    // Générer le JWT
                    const token = securityUtils.generateToken(user);

                    res.json({
                        message: 'Connexion réussie',
                        token: token,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role
                        }
                    });
                } catch (error) {
                    console.error('Erreur de comparaison:', error);
                    return res.status(500).json({ error: 'Erreur serveur' });
                }
            });
        } catch (error) {
            console.error('Erreur login:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // ----------------------------------------------------------
    // POST /api/auth/register
    // Crée un nouvel utilisateur avec mot de passe hashé
    // ----------------------------------------------------------
    register: async (req, res) => {
        try {
            const { username, email, password, passwordConfirm, address } = req.body;

            // Validation
            if (!username || !email || !password || !passwordConfirm) {
                return res.status(400).json({ error: 'Tous les champs sont requis' });
            }

            if (password !== passwordConfirm) {
                return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
            }

            // Vérifier si l'email existe déjà
            const checkQuery = 'SELECT id FROM users WHERE email = ?';
            db.query(checkQuery, [email], async (err, results) => {
                if (err) {
                    console.error('Erreur DB:', err);
                    return res.status(500).json({ error: 'Erreur serveur' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ error: 'Cet email est déjà utilisé' });
                }

                try {
                    // Hasher le mot de passe
                    const hashedPassword = await securityUtils.hashPassword(password);

                    // Insérer l'utilisateur
                    const insertQuery = 'INSERT INTO users (username, email, password, role, address) VALUES (?, ?, ?, ?, ?)';
                    db.query(insertQuery, [username, email, hashedPassword, 'user', address || null], (err, result) => {
                        if (err) {
                            console.error('Erreur DB:', err);
                            return res.status(500).json({ error: 'Erreur lors de la création du compte' });
                        }

                        const newUser = {
                            id: result.insertId,
                            username: username,
                            email: email,
                            role: 'user'
                        };

                        // Générer le JWT
                        const token = securityUtils.generateToken(newUser);

                        res.status(201).json({
                            message: 'Inscription réussie',
                            token: token,
                            user: newUser
                        });
                    });
                } catch (error) {
                    console.error('Erreur hachage:', error);
                    return res.status(500).json({ error: 'Erreur lors de la création du compte' });
                }
            });
        } catch (error) {
            console.error('Erreur register:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};
