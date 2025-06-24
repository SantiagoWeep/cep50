const express = require('express');
const router = express.Router();
const alumnosController = require('../controllers/alumnosController');
const { verifyAdministracion } = require('../controllers/authAdministracionController');

// Protegemos las rutas que necesitan autenticación admin
router.get('/administracion', verifyAdministracion, alumnosController.mostrarAlumnos); // Vista lista de alumnos
router.post('/alumnos', verifyAdministracion, alumnosController.insertarAlumno);

// Nuevas rutas protegidas
router.post('/alumnos/editar/:id', verifyAdministracion, alumnosController.editarAlumno);
router.delete('/alumnos/eliminar/:id', alumnosController.eliminarAlumno);
router.put('/alumnos/:id', verifyAdministracion, alumnosController.actualizarEstadoRegular);
router.get('/admin/buscar-alumnos', verifyAdministracion, alumnosController.buscarAlumnos);

module.exports = router;
