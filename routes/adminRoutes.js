const express = require('express');
const router = express.Router();
const { verifyAdministracion } = require('../controllers/authAdministracionController');

router.get('/administracion', verifyAdministracion, (req, res) => {
  res.render('administracion');
});

module.exports = router;
