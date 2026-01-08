# Ricettario — Backend

### Descrizione
**Ricettario (back-end)** è un'API Node.js/Express che permette di:
- gestire autenticazione (registrazione/login con JWT),
- gestire un inventario ingredienti (CRUD),
- generare automaticamente 3 ricette basate sull'inventario usando Gemini.

Il database usato è **Supabase (Postgres)**. L'API è stateless (JWT) e pensata per essere facilmente deployata.

---

## Tecnologie
- Node.js, Express
- Postgres (tramite Supabase)
- Dipendenze principali: `bcrypt`, `jsonwebtoken`, `postgres`, `dotenv`, `cors`
- Servizio AI esterno (Gemini in questo caso) per generare ricette (richiede `AI_API_KEY`)

---

## Prerequisiti
- Node.js LTS installato
- Account Supabase e un progetto PostgreSQL
- Chiave API di Gemini se vuoi usare la generazione automatica

---

## Installazione & Avvio
1. Clona il repo e spostati nella cartella `back-end`:
   ```bash
   git clone <repo-url>
   cd back-end
   ```
2. Installa dipendenze:
   ```bash
   npm install
   ```
3. Crea un file `.env` (vedi sezione sotto) e poi avvia il server in sviluppo:
   ```bash
   npm run dev
   ```
Server di default: `http://localhost:5000` (PORT via env).

---

## Variabili d'ambiente (esempio)
Crea un file `.env` con almeno le variabili seguenti:
```
PORT=5000
DATABASE_URL=postgres_url
JWT_SECRET=una_chiave_lunga_e_segreta
AI_API_KEY=chiave_api_per_gemini
```
> Nota: per Supabase copia la connection string Postgres dal pannello del progetto e usala in `DATABASE_URL`.

---

## Endpoint API
Tutte le rotte sono prefissate con `/api`.

- Auth (pubbliche)
  - `POST /api/auth/register` — registra utente (body: `{ email, password }`)
  - `POST /api/auth/login` — login (body: `{ email, password }`) → ritorna `token`
  - `POST /api/auth/logout` — logout (stateless; client rimuove token)

- Inventory (protette — header `Authorization: Bearer <token>`)
  - `GET /api/inventory` — lista ingredienti dell'utente
  - `POST /api/inventory` — aggiunge ingrediente (body: `{ name, quantity }`)
  - `DELETE /api/inventory/:itemId` — rimuove ingrediente

- Recipes (protette)
  - `POST /api/recipes/generate` — genera 3 ricette usando l'inventario
  - `GET /api/recipes` — recupera tutte le ricette dell'utente

- User (protette)
  - `GET /api/user/profile` — profilo utente + sue ricette

Autenticazione: invia `Authorization: Bearer <JWT>` per le rotte protette.

---

## Esempi d'uso (curl)
- Registrazione:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"prova@example.com","password":"secret"}'
```
- Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prova@example.com","password":"secret"}'
```
- Aggiungere ingrediente (sostituisci TOKEN):
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"pomodori","quantity":"3"}'
```
- Generare ricette:
```bash
curl -X POST http://localhost:5000/api/recipes/generate \
  -H "Authorization: Bearer TOKEN"
```

---
