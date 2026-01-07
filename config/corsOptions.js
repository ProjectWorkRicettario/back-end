const allowedOrigins = process.env.FRONTEND_URL;

const corsOptions = {
  // La funzione 'origin' controlla se l'origine della richiesta è nella lista 'allowedOrigins'
  origin: (origin, callback) => {
    // Permette le richieste se l'origine è nella lista degli ammessi
    // o se l'origine è assente (es. richieste da Postman o dallo stesso server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Non consentito da CORS"));
    }
  },
  // Non usiamo più cookie di sessione lato browser.
  credentials: false,
  // Metodi HTTP che il frontend può usare
  methods: ["GET", "POST", "PUT", "DELETE"],
  // Header che il frontend può inviare
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = corsOptions;
