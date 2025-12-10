// backend/server.js
const express = require('express');
const cors = require('cors')
const session = require('express-session');
require('dotenv').config();

// *** 1. Importa la configurazione CORS ***
const corsOptions = require('./config/corsOptions'); 

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory'); 
const userRoutes = require('./routes/user');
require('./config/db'); // Inizializza la connessione DB

const app = express();
const PORT = process.env.PORT || 5000;

// *** 2. Applica il middleware CORS usando le opzioni importate ***
app.use(cors(corsOptions));

// Middleware per leggere JSON
app.use(express.json());

// Configurazione Sessione (usa il segreto da .env)
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Lascia false in dev (http)
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// Rotte
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
    console.log(`✅ Backend server attivo su http://localhost:${PORT}`);
});