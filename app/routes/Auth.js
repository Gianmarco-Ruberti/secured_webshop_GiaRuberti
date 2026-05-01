const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AuthController');
const MdpRateLimte = require('../middleware/MdpRateLimte');

router.post('/login',    MdpRateLimte, controller.login);
router.post('/register', controller.register);

module.exports = router;
