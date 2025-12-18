const router = require('express').Router();
const recipeController = require('../controllers/recipeController');
const isAuthenticated = require('../middleware/authMiddleware');

router.use(isAuthenticated);

// Genera 3 ricette dal modello e le salva
router.post('/generate', recipeController.generateRecipes);

// Elenca le ricette dell'utente
router.get('/', recipeController.getRecipes);

module.exports = router;
