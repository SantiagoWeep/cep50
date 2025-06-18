// routes/calificacion.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/calificacionController');
const { verifyToken } = require('../controllers/authController');

router.get('/calificaciones', verifyToken, dashboardController.mostrarListaAlumnos);
router.post('/calificaciones/guardarNotas', verifyToken, dashboardController.guardarNotas);


module.exports = router;
