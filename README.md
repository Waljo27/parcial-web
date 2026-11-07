# Backend de gestion de usuarios y proyectos

Autor: Walter Jose Espinoza Rodriguez
Codigo: 2061740
Asignatura: Programacion Web

## Tecnologias

Node.js, Express, PostgreSQL, bcryptjs y JSON Web Tokens.

## Instalacion

1. Instalar Node.js y PostgreSQL.
2. Descargar o clonar el repositorio.
3. Abrir una terminal dentro de la carpeta del proyecto.
4. Ejecutar npm install.
5. Crear una base de datos llamada parcial_web en PostgreSQL.
6. Abrir Query Tool sobre esa base de datos y ejecutar database.sql
   una sola vez, en una base vacia.
7. Copiar .env.example a un archivo llamado .env.
8. Escribir en PGPASSWORD la contraseña local de PostgreSQL.
9. Ejecutar node preparar.js para generar la clave de los tokens
   y crear el administrador inicial.
10. Ejecutar node index.js.

El servidor utiliza http://localhost:3000.

## Cuenta inicial de prueba

Correo: admin@parcial.com
Contraseña: Parcial2026!

Si el administrador ya existe, preparar.js conserva su contraseña.

## Autenticacion

Enviar POST /auth/login con email y password en un cuerpo JSON.

Copiar el token recibido y utilizarlo en Postman mediante
Authorization, Bearer Token.

Las rutas de usuarios, proyectos y participaciones requieren token.

## Rutas de usuarios

- GET /usuarios
- GET /usuarios/:id
- POST /usuarios
- PUT /usuarios/:id
- DELETE /usuarios/:id

Para crear un usuario se envian nombre, email, password y rol_id.
La contraseña debe tener al menos 8 caracteres.
Para actualizar se envian nombre y email.

## Rutas de proyectos

- GET /proyectos
- GET /proyectos/:id
- POST /proyectos
- PUT /proyectos/:id
- DELETE /proyectos/:id

Para crear o actualizar un proyecto se envia nombre.
Al crearlo, el administrador responsable es el usuario autenticado.

## Rutas de participantes

- GET /proyectos/:id/usuarios
- POST /proyectos/:id/usuarios
- DELETE /proyectos/:id/usuarios/:usuarioId

Para agregar un participante se envia usuario_id.

## Roles y permisos

El administrador puede gestionar usuarios, proyectos y participantes.
El usuario normal puede consultar proyectos y sus participantes.

## Reglas y respuestas

- Los correos son unicos y se guardan en minusculas.
- Las contraseñas se almacenan como hashes.
- Cada usuario tiene un rol.
- Cada proyecto tiene un administrador responsable.
- Una participacion no puede registrarse dos veces.
- 400 indica datos invalidos.
- 401 indica que falta un token valido o que el login fallo.
- 403 indica permisos insuficientes.
- 404 indica un registro o una ruta inexistente.
- 409 indica duplicados o conflictos entre registros relacionados.

## Archivos de configuracion

.env contiene la configuracion local.
.gitignore excluye .env y node_modules.
.env.example sirve como plantilla para configurar otra instalacion.