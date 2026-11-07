BEGIN;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    administrador_id INTEGER REFERENCES usuarios(id)
);

CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    administrador_id INTEGER NOT NULL REFERENCES usuarios(id)
);

CREATE TABLE usuarios_proyectos (
    usuario_id INTEGER NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    proyecto_id INTEGER NOT NULL
        REFERENCES proyectos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, proyecto_id)
);

CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE roles_permisos (
    rol_id INTEGER NOT NULL
        REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL
        REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

INSERT INTO roles (nombre)
VALUES ('Administrador'), ('Usuario');

INSERT INTO permisos (nombre)
VALUES
    ('gestionar_usuarios'),
    ('gestionar_proyectos'),
    ('consultar_proyectos'),
    ('gestionar_participaciones');

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT roles.id, permisos.id
FROM roles
CROSS JOIN permisos
WHERE roles.nombre = 'Administrador';

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT roles.id, permisos.id
FROM roles
CROSS JOIN permisos
WHERE roles.nombre = 'Usuario'
  AND permisos.nombre = 'consultar_proyectos';

COMMIT;