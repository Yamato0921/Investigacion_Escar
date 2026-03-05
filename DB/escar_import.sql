-- ESCAR: esquema y datos de ejemplo (no modifica la base, sólo crea tablas si no existen)
-- IMPORTANTE: selecciona la base de datos destino en phpMyAdmin antes de ejecutar.

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(20) NOT NULL DEFAULT 'administrador',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `usuarios` (`username`, `password`, `rol`) VALUES
('admin', 'admin123', 'administrador'),
('user1', 'userpass1', 'user');

-- Tabla: investigadores
CREATE TABLE IF NOT EXISTS `investigadores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `correo` VARCHAR(150) NOT NULL UNIQUE,
  `area` VARCHAR(100) NOT NULL,
  `foto` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `investigadores` (`nombre`, `correo`, `area`, `foto`) VALUES
('Dra. Ana Pérez', 'ana.perez@example.com', 'Biología', NULL),
('Dr. Juan Gómez', 'juan.gomez@example.com', 'Ingeniería', NULL);

-- Tabla: semilleros
CREATE TABLE IF NOT EXISTS `semilleros` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `codigo` VARCHAR(50) DEFAULT NULL,
  `responsable` VARCHAR(100) DEFAULT NULL,
  `unidad_academica` VARCHAR(100) DEFAULT NULL,
  `acronimo` VARCHAR(20) DEFAULT NULL,
  `fecha_creacion` DATE DEFAULT NULL,
  `logo` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `semilleros` (`nombre`, `codigo`, `responsable`, `unidad_academica`, `acronimo`, `fecha_creacion`, `estado`) VALUES
('Semillero de Biotecnología', 'SBIO-001', 'Dra. Ana Pérez', 'Facultad de Ciencias', 'SBIO', '2020-03-01', 'ACTIVO');

-- Tabla: semilleros_integrantes
CREATE TABLE IF NOT EXISTS `semilleros_integrantes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `semillero_id` INT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `rol` VARCHAR(50) DEFAULT NULL,
  `foto` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`semillero_id`) REFERENCES `semilleros`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `semilleros_integrantes` (`semillero_id`, `nombre`, `rol`) VALUES
(1, 'Andrés López', 'Estudiante');

-- Tabla: proyectos
CREATE TABLE IF NOT EXISTS `proyectos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(200) NOT NULL,
  `contenido` TEXT NOT NULL,
  `imagen` VARCHAR(255) DEFAULT NULL,
  `fecha_publicacion` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `proyectos` (`titulo`, `contenido`, `imagen`, `fecha_publicacion`) VALUES
('Proyecto Piloto X', 'Descripción del proyecto piloto X. Objetivos y metodología.', NULL, '2025-11-01');

-- Tabla: convocatorias
CREATE TABLE IF NOT EXISTS `convocatorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `archivo` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `convocatorias` (`titulo`, `descripcion`, `fecha_inicio`, `fecha_fin`) VALUES
('Convocatoria Semillero 2026', 'Convocatoria para estudiantes interesados en participar en semilleros de investigación.', '2026-03-01', '2026-04-30');