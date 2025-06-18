const express = require('express');
const router = express.Router();
const profesoresController = require('../controllers/profesoresController');
const { verifyAdministracion } = require('../controllers/authAdministracionController');

// Proteger rutas con JWT admin
router.get('/profesores', verifyAdministracion, profesoresController.mostrarProfesores);

router.put('/profesores/:id/activo', verifyAdministracion, profesoresController.actualizarActivo);
router.post('/admin/profesores', verifyAdministracion, profesoresController.agregarProfesor);

router.get('/admin/profesores', verifyAdministracion, profesoresController.buscarProfesores);
router.post('/profesores/editar', verifyAdministracion, profesoresController.editarProfesor);
router.delete('/profesores/:id', verifyAdministracion, profesoresController.eliminarProfesor);

module.exports = router;
