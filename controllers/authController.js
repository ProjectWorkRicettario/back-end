const db = require("../config/db");
const bcrypt = require("bcrypt");

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

    res.status(201).json({ message: "Registrazione completata.", user: inserted && inserted[0] });
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

// logout rimane identico

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
