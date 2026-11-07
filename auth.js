const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        mensaje: 'Escribe el correo y la contraseña'
      });
    }

    const resultado = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    const usuario = resultado.rows[0];

    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '2h', algorithm: 'HS256' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol_id: usuario.rol_id
      }
    });
  } catch (error) {
    next(error);
  }
});

async function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';

  if (!encabezado.startsWith('Bearer ')) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesion'
    });
  }

  let datos;

  try {
    datos = jwt.verify(
      encabezado.slice(7),
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token invalido o vencido'
    });
  }

  try {
    const resultado = await db.query(
      'SELECT id, nombre, rol_id FROM usuarios WHERE id = $1',
      [datos.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    req.usuario = resultado.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

function permitir(permiso) {
  return async (req, res, next) => {
    try {
      const resultado = await db.query(
        `SELECT permisos.id
         FROM permisos
         JOIN roles_permisos
           ON roles_permisos.permiso_id = permisos.id
         WHERE roles_permisos.rol_id = $1
           AND permisos.nombre = $2`,
        [req.usuario.rol_id, permiso]
      );

      if (resultado.rows.length === 0) {
        return res.status(403).json({
          mensaje: 'No tienes permiso para esta accion'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { router, autenticar, permitir };