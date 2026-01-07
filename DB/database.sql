-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS escar_db;
USE escar_db;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'administrador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de investigadores
CREATE TABLE IF NOT EXISTS investigadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    area VARCHAR(50) NOT NULL,
    foto MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar usuario administrador por defecto (con contraseña hasheada y plain text)
INSERT INTO usuarios (username, password, rol) VALUES
('admin', 'admin123', 'administrador')
ON DUPLICATE KEY UPDATE password='admin123';
-- Contraseña en texto plano para facilitar pruebas

-- Crear tabla de semilleros
CREATE TABLE IF NOT EXISTS semilleros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    responsable VARCHAR(100) NOT NULL,
    unidad_academica VARCHAR(100) NOT NULL,
    acronimo VARCHAR(20) NOT NULL,
    fecha_creacion DATE NOT NULL,
    logo MEDIUMTEXT,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de integrantes de semilleros
CREATE TABLE IF NOT EXISTS semilleros_integrantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semillero_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL, -- Ej: Investigador Principal, Estudiante, Docente
    foto MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id) ON DELETE CASCADE
);

-- Crear tabla de proyectos (blog)
CREATE TABLE IF NOT EXISTS proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    imagen MEDIUMTEXT,
    fecha_publicacion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
