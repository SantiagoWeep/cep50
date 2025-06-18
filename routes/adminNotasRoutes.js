const express = require('express');
const router = express.Router();

const adminNotasController = require('../controllers/adminNotasController');
const { verifyAdministracion } = require('../controllers/authAdministracionController');

router.get('/admin/notas', verifyAdministracion, adminNotasController.mostrarNotas);
router.get('/admin/buscar-notas', verifyAdministracion, adminNotasController.buscarNotas);

module.exports = router;
