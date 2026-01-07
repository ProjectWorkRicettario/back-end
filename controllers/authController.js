const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

// register
exports.register = async (req, res) => {
  const { email, password } = req.body;
  const saltRounds = 10;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email e password sono richiesti." });

  try {
    const password_hash = await bcrypt.hash(password, saltRounds);
    const inserted = await db`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${password_hash})
      RETURNING id, email
    `;

    const user = inserted && inserted[0];
    // Genera JWT per il nuovo utente (7 giorni)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: "Registrazione completata.", user, token });
  } catch (error) {
    console.error("Errore di registrazione:", error);
    if (error && error.code === '23505') {
      return res.status(409).json({ message: "Email già registrata." });
    }
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await db`SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1`;
    if (!users || users.length === 0)
      return res.status(401).json({ message: "Credenziali non valide." });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Credenziali non valide." });

    // Genera un JWT e lo restituisce al client (stateless)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: "Login effettuato!",
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Errore di login:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Logout (stateless - il client si occuperà di rimuovere il token)
exports.logout = (req, res) => {
  // Con JWT stateless non possiamo invalidare il token senza un blacklist;
  // per ora rispondiamo semplicemente OK e il client cancellerà il token locale.
  res.status(200).json({ message: "Logout avvenuto con successo." });
};
