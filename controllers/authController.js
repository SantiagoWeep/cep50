const jwt = require('jsonwebtoken');
const db = require('../config/db');

const PROFES_PASSWORD = process.env.PROFES_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

exports.renderLogin = (req, res) => {
  res.render('login', { layout: false }); // o res.sendFile si usás HTML plano
};

exports.login = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    if (password !== PROFES_PASSWORD) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const [results] = await db.query('SELECT * FROM profesores WHERE dni = ?', [usuario]);
    if (results.length === 0) {
      return res.status(401).json({ error: 'DNI no encontrado' });
    }

    const profesor = results[0];

    const token = jwt.sign(
      {
        id: profesor.id,
        nombre: profesor.nombre,
        apellido: profesor.apellido,
        rol: 'profesor'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/calificaciones'); // solo si todo salió bien
  } catch (err) {
    console.error('Error en DB:', err);
    res.status(500).json({ error: 'Error en DB' });
  }
};


exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.profesor = decoded;
    next();
  } catch (err) {
    return res.redirect('/login');
  }
};

