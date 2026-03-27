// =============================================================
// Middleware d'authentification et d'autorisation
// =============================================================

const securityUtils = require('../utils/security');

const authMiddleware = (req, res, next) => {
    try {
        // Récupérer le token du header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant ou invalide' });
        }

        const token = authHeader.slice(7); // Enlever 'Bearer '
        
        // Vérifier et décoder le token
        const decoded = securityUtils.verifyToken(token);
        
        // Ajouter l'utilisateur aux données de la requête
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }
};

// Middleware pour vérifier le rôle administrateur
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé: rôle administrateur requis' });
    }
    
    next();
};

module.exports = {
    auth: authMiddleware,
    admin: adminMiddleware
};
