const jwt = require('jsonwebtoken');

// Renderiza la vista de login
exports.renderLoginAdministracion = (req, res) => {
  res.render('loginAdministracion', { layout: false });
};

// Login de administración
exports.loginAdministracion = (req, res) => {
  const { usuario, password } = req.body;

  // Validar credenciales con .env
  if (
    usuario !== process.env.ADMIN_USUARIO ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Generar token JWT
  const token = jwt.sign({ rol: 'admin' }, process.env.JWT_SECRET_ADMIN, {
    expiresIn: '1h',
  });

  // Guardar token en cookie
  res.cookie('tokenAdmin', token, { httpOnly: true });

  // Respuesta de éxito (el front redirige)
  res.json({ success: true, redirect: '/administracion' });
};

// Middleware de verificación
exports.verifyAdministracion = (req, res, next) => {
  const token = req.cookies.tokenAdmin;
  if (!token) return res.redirect('/loginAdministracion');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);

    if (decoded.rol !== 'admin') {
      throw new Error('No autorizado');
    }

    req.admin = decoded; // guardo info por si la querés usar
    next();
  } catch (err) {
    return res.redirect('/loginAdministracion');
  }
};

// Logout: borrar cookie
exports.logoutAdministracion = (req, res) => {
  res.clearCookie('tokenAdmin');
  res.redirect('/loginAdministracion');
};
