// controllers/authController.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.renderLogin = (req, res) => {
  res.render('login', { layout: false }); // ← esto evita que use el layout
};


exports.login = async (req, res) => {
  const { usuario, password } = req.body;
  console.log('Login recibido:', usuario, password);

  if (usuario !== '123') {
    console.log('Usuario incorrecto');
    return res.status(401).send('Usuario incorrecto');
  }

  try {
    const [results] = await db.query('SELECT * FROM profesores WHERE dni = ?', [password]);

    console.log('Resultados de profesor:', results);

    if (results.length === 0) {
      console.log('No se encontró profesor');
      return res.status(401).send('Contraseña incorrecta');
    }

    const profesor = results[0];
    console.log('Profesor encontrado:', profesor);

    const token = jwt.sign(
      {
        id: profesor.id,
        nombre: profesor.nombre,
        apellido: profesor.apellido,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generado:', token);

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/calificaciones');
  } catch (err) {
    console.error('Error en DB:', err);
    res.status(500).send('Error en DB');
  }
};


exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    console.log('No token en cookies');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);  // 👈 Esto debería imprimir algo útil
    req.profesor = decoded;
    next();
  } catch (err) {
    console.log('Error al verificar token:', err.message); // 👈 Verás si el secreto es incorrecto
    return res.redirect('/login');
  }
};
