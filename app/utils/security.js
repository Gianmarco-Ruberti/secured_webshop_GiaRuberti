// =============================================================
// Utilitaires de sécurité (hachage, JWT, etc.)
// =============================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const security = require('../config/security');

module.exports = {
    // Hacher un mot de passe
    // Utilise bcrypt avec un sel aléatoire + pepper
    hashPassword: async (password) => {
        try {
            // Ajouter le pepper au mot de passe
            const peppered = password + security.pepper;
            // Générer un sel et hasher
            const hashed = await bcrypt.hash(peppered, security.bcrypt.saltRounds);
            return hashed;
        } catch (error) {
            throw new Error(`Erreur lors du hachage: ${error.message}`);
        }
    },

    // Comparer un mot de passe avec son hash
    comparePassword: async (password, hash) => {
        try {
            // Ajouter le pepper au mot de passe pour la comparaison
            const peppered = password + security.pepper;
            return await bcrypt.compare(peppered, hash);
        } catch (error) {
            throw new Error(`Erreur lors de la comparaison: ${error.message}`);
        }
    },

    // Générer un JWT
    generateToken: (user) => {
        try {
            const payload = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            };
            return jwt.sign(payload, security.jwt.secret, {
                expiresIn: security.jwt.expiresIn,
                algorithm: security.jwt.algorithm
            });
        } catch (error) {
            throw new Error(`Erreur lors de la génération du token: ${error.message}`);
        }
    },

    // Vérifier et décoder un JWT
    verifyToken: (token) => {
        try {
            return jwt.verify(token, security.jwt.secret, {
                algorithms: [security.jwt.algorithm]
            });
        } catch (error) {
            throw new Error(`Token invalide: ${error.message}`);
        }
    }
};
