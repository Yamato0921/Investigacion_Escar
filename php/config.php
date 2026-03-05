<?php
// Configuración de sesiones
ini_set('session.cookie_lifetime', 0);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');

// Iniciar sesión
session_start();

// Configuración de la base de datos (Legacy MySQL - Opcional)
$db_host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
$db_port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: 3306;
$db_user = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
$db_pass = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';
$db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'escar_db';

// El portal ahora usa MongoDB como base de datos principal.
// Se mantiene la variable $conn como null para compatibilidad con código antiguo que no haya sido migrado aún.
$conn = null;

