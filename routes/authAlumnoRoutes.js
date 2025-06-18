const express = require('express');
const router = express.Router();
const authAlumnoController = require('../controllers/authAlumnoController');

// Mostrar formulario de login para alumnos
router.get('/loginAlumno', authAlumnoController.renderLoginAlumno);

// Procesar login de alumno
router.post('/loginAlumno', authAlumnoController.loginAlumno);

module.exports = router;
