<?php
require_once __DIR__ . '/../vendor/autoload.php';

// Cargar variables de entorno si existen
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}

// Configuración de CORS
$corsOrigin = getenv('CORS_ORIGIN') ?: (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*');
// Solo enviar cabeceras cuando no estemos en CLI
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . $corsOrigin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Dejar que `config.php` maneje la inicialización de la sesión y la configuración de ini
require_once __DIR__ . '/config.php';

// Integración opcional de MongoDB (si está configurado)
if (file_exists(__DIR__ . '/mongo_helper.php')) {
    require_once __DIR__ . '/mongo_helper.php';
    try {
        if (getenv('MONGO_URI')) {
            $GLOBALS['mongoClient'] = create_mongo_client_with_retry();
        }
    } catch (Throwable $e) {
        error_log('[bootstrap] Mongo client init failed: ' . $e->getMessage());
        $GLOBALS['mongoClient'] = null; // degrade gracefully
    }
}

// Rate limiting (usar variables de entorno para ajustar)
if (file_exists(__DIR__ . '/rate_limit.php')) {
    require_once __DIR__ . '/rate_limit.php';
    $rate = getenv('RATE_LIMIT_PER_MIN') ? intval(getenv('RATE_LIMIT_PER_MIN')) : 180;
    $window = 60; // segundos
    if (!rate_limit_check($rate, $window)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Too many requests']);
        exit();
    }
}
