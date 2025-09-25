const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.renderLoginAlumno = (req, res) => {
  res.render('loginAlumno', { layout: false }); // ← esto evita el layout
};
exports.loginAlumno = async (req, res) => {
  const { usuario, password } = req.body;

  if (usuario !== '123') {
    return res.status(401).json({ error: 'Usuario incorrecto' });
  }

  try {
    const [results] = await db.query('SELECT * FROM alumnos WHERE dni = ?', [password]);

    if (results.length === 0) {
      return res.status(401).json({ error: 'DNI no encontrado' });
    }

    const alumno = results[0];

    const token = jwt.sign(
      {
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('tokenAlumno', token, { httpOnly: true });
    res.redirect('/boletin'); // éxito → redirige
  } catch (err) {
    console.error('Error en DB:', err);
    res.status(500).json({ error: 'Error en DB' });
  }
};



exports.verifyAlumno = (req, res, next) => {
  const token = req.cookies.tokenAlumno; // Leer token del navegador
  if (!token) return res.redirect('/loginAlumno'); // No hay token = no autenticado

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificar token
    req.alumno = decoded; // Guardar datos decodificados (id, nombre, apellido)
    next(); // Continuar a la siguiente función (ej: mostrarBoletin)
  } catch (err) {
    return res.redirect('/loginAlumno'); // Token inválido o vencido
  }
};
