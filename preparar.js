const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function preparar() {
  if (!process.env.JWT_SECRET) {
    const secreto = crypto.randomBytes(48).toString('hex');

    fs.appendFileSync(
      '.env',
      '\nJWT_SECRET=' + secreto + '\n'
    );

    console.log('Clave de tokens creada');
  }

  const clave = await bcrypt.hash('Parcial2026!', 10);

  const resultado = await db.query(
    `INSERT INTO usuarios (nombre, email, password, rol_id)
     SELECT $1, $2, $3, id
     FROM roles WHERE nombre = 'Administrador'
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['Administrador', 'admin@parcial.com', clave]
  );

  if (resultado.rows.length > 0) {
    console.log('Administrador de prueba creado');
  } else {
    console.log('El administrador ya existia, conserva su contraseña');
  }
}

preparar()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());