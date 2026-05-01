const WINDOW = 1000;
const ATTEMPTS = 3;
const attemptsByIp = new Map();

module.exports = (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || 'unknown';
    const existing = attemptsByIp.get(ip);

    // Si l'IP n'existe pas ou que le temps est écoulé, on reset à 1
    if (!existing || existing.resetTime <= now) {
        attemptsByIp.set(ip, { count: 1, resetTime: now + WINDOW });
        return next();
    }

    // Si on a atteint la limite
    if (existing.count >= ATTEMPTS) {
        return res.status(429).json({ error: 'Trop de tentatives.' });
    }

    // Sinon on incrémente
    existing.count++;
    next();
};