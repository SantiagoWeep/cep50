// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.cookies.token;
  console.log('Token recibido:', token); // Verifica si el token existe
  
  if (!token) {
    console.log('Token no encontrado, redirigiendo a /login');
    return res.redirect('/login');
  }

  try {
    req.profesor = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Profesor decodificado:', req.profesor); // Verifica el contenido del token
    next();
  } catch (err) {
    console.error('Error al verificar JWT:', err);
    res.redirect('/login');
  }
};
