const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accesso negato. Devi effettuare il login.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id };
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Token non valido o scaduto.' });
    }
};

module.exports = isAuthenticated;