const jwt = require('jsonwebtoken');

exports.renderLoginAdministracion = (req, res) => {
  res.render('loginAdministracion', { layout: false }); // Evita usar el layout general
};


exports.loginAdministracion = (req, res) => {
  const { usuario, password } = req.body;

  // Validar contra valores en .env
  if (
    usuario !== process.env.ADMIN_USUARIO ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).send('Credenciales incorrectas');
  }

  // Firmar con JWT_SECRET_ADMIN
  const token = jwt.sign({ rol: 'admin' }, process.env.JWT_SECRET_ADMIN, {
    expiresIn: '1h',
  });

  // Guardar cookie httpOnly para seguridad
  res.cookie('tokenAdmin', token, { httpOnly: true });
  res.redirect('/administracion');
};

exports.verifyAdministracion = (req, res, next) => {
  const token = req.cookies.tokenAdmin;
  if (!token) return res.redirect('/loginAdministracion');

  try {
    // Verificar con JWT_SECRET_ADMIN (la misma clave que al firmar)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
    if (decoded.rol !== 'admin') throw new Error('No autorizado');
    next();
  } catch (err) {
    return res.redirect('/loginAdministracion');
  }
};
