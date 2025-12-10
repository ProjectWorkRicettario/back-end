// backend/controllers/authController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");

// 1. Registrazione (Hashing della Password)
exports.register = async (req, res) => {
  const { email, password } = req.body;
  const saltRounds = 10;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email e password sono richiesti." });
  }

  try {
    // Hashing della password
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Inserimento nel DB (assumiamo la tabella 'users' esista con email e password_hash)
    await db.query("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
      email,
      password_hash,
    ]);

    res.status(201).json({ message: "Registrazione completata." });
  } catch (error) {
    console.error("Errore di registrazione:", error);
    // Codice 1062 è per "Duplicate entry" in MySQL
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email già registrata." });
    }
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// 2. Login (Confronto HASH e Gestione Sessione)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cerca l'utente
    const [users] = await db.query(
      "SELECT id, email, password_hash FROM users WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: "Credenziali non valide." });
    }

    const user = users[0];

    // 2. Confronta la password fornita con l'hash nel DB
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenziali non valide." });
    }

    // 3. Login Riuscito: crea una sessione
    // La sessione memorizza l'ID dell'utente nel server e invia un cookie ID al client.
    req.session.userId = user.id;

    res
      .status(200)
      .json({
        message: "Login effettuato!",
        user: { id: user.id, email: user.email },
      });
  } catch (error) {
    console.error("Errore di login:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// 3. Logout - Distrugge la sessione nel server
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Errore durante il logout:", err);
      return res
        .status(500)
        .json({ message: "Errore durante la disconnessione." });
    }
    // Il browser non riceverà più il cookie di sessione valido
    res.status(200).json({ message: "Logout avvenuto con successo." });
  });
};
