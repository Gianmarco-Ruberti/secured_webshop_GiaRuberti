const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AdminController');
const { auth, admin } = require('../middleware/auth');

// Toutes les routes admin nécessitent authentification ET rôle admin
router.get('/users', auth, admin, controller.getUsers);

module.exports = router;
