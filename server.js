// backend/server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

// *** 1. Importa la configurazione CORS ***
const corsOptions = require("./config/corsOptions");

const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const userRoutes = require("./routes/user");
const recipesRoutes = require("./routes/recipes");
require("./config/db"); // Inizializza la connessione DB

const app = express();
const PORT = process.env.PORT || 5000;
// Trust proxy in order to respect X-Forwarded-* headers from Render / Vercel
// This ensures req.secure is true when requests come over HTTPS through the proxy
app.set("trust proxy", 1);

// *** 2. Applica il middleware CORS usando le opzioni importate ***
app.use(cors(corsOptions));

// Middleware per leggere JSON
app.use(express.json());

// Configurazione Sessione (proxy:true abilitato, cookie Secure/SameSite=None per HTTPS)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Rotte
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/user", userRoutes);
app.use('/api/recipes', recipesRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend server attivo sulla porta: ${PORT}`);
});
