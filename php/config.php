<?php
// Configuración de sesiones
ini_set('session.cookie_lifetime', 0);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');

// Iniciar sesión
session_start();

// Configuración de la base de datos (leer desde variables de entorno para producción)
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: 3306;
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'escar_db';
$db_socket = getenv('DB_SOCKET') ?: null; // opcional para unix socket
$db_ssl_ca = getenv('DB_SSL_CA') ?: null; // ruta al certificado CA si se usa SSL

try {
    $options = array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
        PDO::ATTR_EMULATE_PREPARES => false
    );
    // Construir DSN considerando puerto o socket
    if ($db_socket) {
        $dsn = "mysql:unix_socket={$db_socket};dbname={$db_name};charset=utf8mb4";
    } else {
        $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    }

    // Si se proporciona CA para SSL, añadir opciones PDO si están disponibles
    if ($db_ssl_ca && defined('PDO::MYSQL_ATTR_SSL_CA')) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $db_ssl_ca;
    }

    $conn = new PDO($dsn, $db_user, $db_pass, $options);
} catch(PDOException $e) {
    error_log('DB connection error: ' . $e->getMessage());
    // En producción no revelar detalles al cliente
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit();
}
