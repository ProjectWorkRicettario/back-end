const isAuthenticated = (req, res, next) => {
    // Controlla se l'ID utente è salvato nella sessione
    if (req.session.userId) {
        // Se l'utente è loggato, l'ID è disponibile per i controller successivi
        req.user = { id: req.session.userId }; 
        return next();
    }
    // Se non è loggato
    res.status(401).json({ message: 'Accesso negato. Devi effettuare il login.' });
};

module.exports = isAuthenticated;