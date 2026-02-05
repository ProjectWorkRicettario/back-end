const router = require('express').Router();
const recipeController = require('../controllers/recipeController');
const isAuthenticated = require('../middleware/authMiddleware');

router.use(isAuthenticated);

// Genera 3 ricette dal modello e le salva
router.post('/generate', recipeController.generateRecipes);


// Quando il frontend invia una POST a /api/recipes/share...
// 1. authMiddleware controlla se l'utente è loggato
// 2. recipeController.shareRecipe esegue il salvataggio nel DB
router.post('/share', recipeController.shareRecipe);
// In backend/routes/recipes.js
router.delete('/:recipeId', isAuthenticated, recipeController.deleteRecipe);
router.get('/shared', recipeController.getSharedRecipes);

// Elenca le ricette dell'utente
router.get('/', recipeController.getRecipes);


module.exports = router;


