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

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (username, password, rol) VALUES
('admin', '$2y$10$RfdCgxXwknTc4NJZYGQzv.BaGynOWNB.JeqoKu6RNL/tvFpTRXk2.', 'administrador');
-- La contraseña es 'admin123' hasheada con bcrypt
