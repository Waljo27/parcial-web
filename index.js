const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { router, autenticar, permitir } = require('./auth');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend conectado a PostgreSQL' });
});

app.use('/auth', router);

// Todas las rutas siguientes requieren iniciar sesion.
app.use(autenticar);

// Usuarios

app.get('/usuarios', permitir('gestionar_usuarios'), async (req, res) => {
  const resultado = await db.query(
    `SELECT id, nombre, email, rol_id, administrador_id
     FROM usuarios ORDER BY id`
  );

  res.json(resultado.rows);
});

app.get('/usuarios/:id', permitir('gestionar_usuarios'), async (req, res) => {
  const resultado = await db.query(
    `SELECT id, nombre, email, rol_id, administrador_id
     FROM usuarios WHERE id = $1`,
    [req.params.id]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  res.json(resultado.rows[0]);
});

app.post('/usuarios', permitir('gestionar_usuarios'), async (req, res) => {
  const { nombre, email, password, rol_id } = req.body || {};

  if (
    typeof nombre !== 'string' || !nombre.trim() ||
    typeof email !== 'string' || !email.includes('@') ||
    typeof password !== 'string' || password.length < 8 ||
    !Number.isInteger(rol_id)
  ) {
    return res.status(400).json({
      mensaje: 'Envia nombre, email, password de minimo 8 caracteres y rol_id numerico'
    });
  }

  const clave = await bcrypt.hash(password, 10);

  const resultado = await db.query(
    `INSERT INTO usuarios
       (nombre, email, password, rol_id, administrador_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombre, email, rol_id, administrador_id`,
    [
      nombre.trim(),
      email.trim().toLowerCase(),
      clave,
      rol_id,
      req.usuario.id
    ]
  );

  res.status(201).json(resultado.rows[0]);
});

app.put('/usuarios/:id', permitir('gestionar_usuarios'), async (req, res) => {
  const { nombre, email } = req.body || {};

  if (
    typeof nombre !== 'string' || !nombre.trim() ||
    typeof email !== 'string' || !email.includes('@')
  ) {
    return res.status(400).json({ mensaje: 'Envia nombre y email validos' });
  }

  const resultado = await db.query(
    `UPDATE usuarios SET nombre = $1, email = $2
     WHERE id = $3
     RETURNING id, nombre, email, rol_id, administrador_id`,
    [nombre.trim(), email.trim().toLowerCase(), req.params.id]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  res.json(resultado.rows[0]);
});

app.delete('/usuarios/:id', permitir('gestionar_usuarios'), async (req, res) => {
  if (Number(req.params.id) === req.usuario.id) {
    return res.status(400).json({
      mensaje: 'No puedes eliminar tu propio usuario'
    });
  }

  const resultado = await db.query(
    'DELETE FROM usuarios WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  res.json({ mensaje: 'Usuario eliminado' });
});

// Proyectos

app.get('/proyectos', permitir('consultar_proyectos'), async (req, res) => {
  const resultado = await db.query(
    'SELECT * FROM proyectos ORDER BY id'
  );

  res.json(resultado.rows);
});

app.get('/proyectos/:id', permitir('consultar_proyectos'), async (req, res) => {
  const resultado = await db.query(
    'SELECT * FROM proyectos WHERE id = $1',
    [req.params.id]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
  }

  res.json(resultado.rows[0]);
});

app.post('/proyectos', permitir('gestionar_proyectos'), async (req, res) => {
  const nombre = req.body?.nombre;

  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ mensaje: 'Escribe el nombre del proyecto' });
  }

  const resultado = await db.query(
    `INSERT INTO proyectos (nombre, administrador_id)
     VALUES ($1, $2) RETURNING *`,
    [nombre.trim(), req.usuario.id]
  );

  res.status(201).json(resultado.rows[0]);
});

app.put('/proyectos/:id', permitir('gestionar_proyectos'), async (req, res) => {
  const nombre = req.body?.nombre;

  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ mensaje: 'Escribe el nombre del proyecto' });
  }

  const resultado = await db.query(
    'UPDATE proyectos SET nombre = $1 WHERE id = $2 RETURNING *',
    [nombre.trim(), req.params.id]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
  }

  res.json(resultado.rows[0]);
});

app.delete('/proyectos/:id', permitir('gestionar_proyectos'), async (req, res) => {
  const resultado = await db.query(
    'DELETE FROM proyectos WHERE id = $1 RETURNING id',
    [req.params.id]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
  }

  res.json({ mensaje: 'Proyecto eliminado' });
});

// Participaciones

app.get(
  '/proyectos/:id/usuarios',
  permitir('consultar_proyectos'),
  async (req, res) => {
    const proyecto = await db.query(
      'SELECT id FROM proyectos WHERE id = $1',
      [req.params.id]
    );

    if (proyecto.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
    }

    const resultado = await db.query(
      `SELECT usuarios.id, usuarios.nombre, usuarios.email
       FROM usuarios
       JOIN usuarios_proyectos
         ON usuarios_proyectos.usuario_id = usuarios.id
       WHERE usuarios_proyectos.proyecto_id = $1
       ORDER BY usuarios.id`,
      [req.params.id]
    );

    res.json(resultado.rows);
  }
);

app.post(
  '/proyectos/:id/usuarios',
  permitir('gestionar_participaciones'),
  async (req, res) => {
    const usuarioId = req.body?.usuario_id;

    if (!Number.isInteger(usuarioId) || usuarioId < 1) {
      return res.status(400).json({ mensaje: 'Envia usuario_id numerico valido' });
    }

    const resultado = await db.query(
      `INSERT INTO usuarios_proyectos (usuario_id, proyecto_id)
       VALUES ($1, $2) RETURNING *`,
      [usuarioId, req.params.id]
    );

    res.status(201).json(resultado.rows[0]);
  }
);

app.delete(
  '/proyectos/:id/usuarios/:usuarioId',
  permitir('gestionar_participaciones'),
  async (req, res) => {
    const resultado = await db.query(
      `DELETE FROM usuarios_proyectos
       WHERE proyecto_id = $1 AND usuario_id = $2
       RETURNING *`,
      [req.params.id, req.params.usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Participacion no encontrada' });
    }

    res.json({ mensaje: 'Participacion eliminada' });
  }
);

// Respuesta para rutas que no existen.

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejo de errores de PostgreSQL y de las solicitudes.

app.use((error, req, res, next) => {
  if (error.code === '23505') {
    return res.status(409).json({
      mensaje: 'El correo o la participacion ya existe'
    });
  }

  if (error.code === '23503') {
    return res.status(409).json({
      mensaje: 'La relacion no existe o el registro tiene datos asociados'
    });
  }

  if (
    error.code === '22P02' ||
    error.code === '22001' ||
    error.code === '23502' ||
    error.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({ mensaje: 'Revisa los datos enviados' });
  }

  console.error(error.message);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

async function iniciar() {
  if (!process.env.JWT_SECRET) {
    console.error('Primero ejecuta node preparar.js');
    await db.end();
    process.exitCode = 1;
    return;
  }

  await db.query('SELECT 1');

  const puerto = Number(process.env.PORT) || 3000;

  app.listen(puerto, () => {
    console.log('Base de datos conectada');
    console.log('Servidor listo en http://localhost:' + puerto);
  });
}

iniciar().catch(async error => {
  console.error('No se pudo iniciar:', error.message);
  await db.end();
  process.exitCode = 1;
});