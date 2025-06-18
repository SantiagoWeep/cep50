const express = require('express');
const router = express.Router();
const boletinController = require('../controllers/boletinController');
const { verifyAlumno } = require('../controllers/authAlumnoController');

router.get('/boletin', verifyAlumno, boletinController.mostrarBoletin); // ✅ protegido

module.exports = router;
