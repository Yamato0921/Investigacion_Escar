<?php
// Script de verificación
require_once 'config.php';

// 1. Verificar la conexión a la base de datos
try {
    $conn->query("SELECT 1");
    echo "✓ Conexión a la base de datos exitosa\n";
} catch (PDOException $e) {
    echo "✗ Error de conexión a la base de datos: " . $e->getMessage() . "\n";
    die();
}

// 2. Verificar si las tablas existen
try {
    $tables = ['usuarios', 'investigadores'];
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result->rowCount() > 0) {
            echo "✓ Tabla '$table' existe\n";
        } else {
            echo "✗ Tabla '$table' no existe\n";
        }
    }
} catch (PDOException $e) {
    echo "✗ Error verificando tablas: " . $e->getMessage() . "\n";
}

// 3. Verificar si existe el usuario admin
try {
    $stmt = $conn->prepare("SELECT id, username FROM usuarios WHERE username = 'admin'");
    $stmt->execute();
    if ($stmt->rowCount() > 0) {
        echo "✓ Usuario admin existe\n";
    } else {
        echo "✗ Usuario admin no existe\n";
        // Crear usuario admin
        $password = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, 'administrador')");
        $stmt->execute(['admin', $password]);
        echo "✓ Usuario admin creado con contraseña: admin123\n";
    }
} catch (PDOException $e) {
    echo "✗ Error verificando usuario: " . $e->getMessage() . "\n";
}

// 4. Verificar configuración de sesiones
$sessionPath = session_save_path();
if (is_writable($sessionPath)) {
    echo "✓ Directorio de sesiones ($sessionPath) es escribible\n";
} else {
    echo "✗ Directorio de sesiones ($sessionPath) no es escribible\n";
}

// 5. Verificar si session.save_handler está configurado correctamente
$saveHandler = ini_get('session.save_handler');
echo "✓ Session save handler: $saveHandler\n";

// 6. Verificar otras configuraciones importantes
$configs = [
    'session.gc_maxlifetime' => ini_get('session.gc_maxlifetime'),
    'session.cookie_lifetime' => ini_get('session.cookie_lifetime'),
    'session.cookie_secure' => ini_get('session.cookie_secure'),
    'session.cookie_httponly' => ini_get('session.cookie_httponly'),
];

foreach ($configs as $key => $value) {
    echo "✓ $key = $value\n";
}
