// backend/routes/inventory.js
const router = require('express').Router();
const inventoryController = require('../controllers/inventoryController');
const isAuthenticated = require('../middleware/authMiddleware');

router.use(isAuthenticated); // Tutte le rotte qui sotto sono protette

router.get('/', inventoryController.getInventory);
router.post('/', inventoryController.addItem);
router.delete('/:itemId', inventoryController.deleteItem);

module.exports = router;