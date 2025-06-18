const express = require('express');
const router = express.Router();
const authAdminController = require('../controllers/authAdministracionController');

// Login
router.get('/loginAdministracion', authAdminController.renderLoginAdministracion);
router.post('/loginAdministracion', authAdminController.loginAdministracion);

module.exports = router;
