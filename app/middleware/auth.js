// =============================================================
// Middleware d'authentification et d'autorisation
// =============================================================

const securityUtils = require('../utils/security');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
    try {
        // Récupérer le token du header Authorization
        const authHeader = req.headers.authorization;
        console.log('Auth Middleware: Authorization Header:', authHeader); // Debug
        logger.warn('AUTH_ATTEMPT', `Tentative d'accès`, { ip: req.ip });
        return res.status(401).json({ error: 'debug' });
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('UNAUTHORIZED_ACCESS', `Tentative d'accès sans token à ${req.originalUrl}`, { ip: req.ip });
            return res.status(401).json({ error: 'Token manquant ou invalide' });
        }

        const token = authHeader.slice(7); // Enlever 'Bearer '
        
        // Vérifier et décoder le token
        const decoded = securityUtils.verifyToken(token);
        
        // Ajouter l'utilisateur aux données de la requête
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('CRITICAL_ERROR', 'Crash dans le middleware d\'authentification', { error: error.message });
        return res.status(401).json({ error: error.message });
    }
};

// Middleware pour vérifier le rôle administrateur
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        logger.error('FORBIDDEN_ACCESS', `Utilisateur non-admin a tenté d'accéder à une route admin`, {
            userId: req.user.id, 
            path: req.originalUrl 
        });
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    if (req.user.role !== 'admin') {
        logger.error('FORBIDDEN_ACCESS', `Utilisateur ${req.user.id} a tenté d'accéder à une route admin`, {
            userId: req.user.id, 
            path: req.originalUrl 
        });
        return res.status(403).json({ error: 'Accès refusé: rôle administrateur requis' });
    }
    
    next();
};

module.exports = {
    auth: authMiddleware,
    admin: adminMiddleware
};
