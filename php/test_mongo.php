<?php
// Test simple para MongoDB Atlas
// `vendor/autoload.php` está en la raíz del proyecto, no dentro de `php/`
require_once __DIR__ . '/../vendor/autoload.php';
// Cargar .env local si existe (para CLI)
if (file_exists(__DIR__ . '/.env') && class_exists('\Dotenv\Dotenv')) {
    try {
        $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
        $dotenv->load();
    } catch (Throwable $e) {
        // continuar; las variables pueden venir del entorno
        fwrite(STDERR, "Warning: could not load php/.env: " . $e->getMessage() . "\n");
    }
}
require_once __DIR__ . '/mongo_helper.php';

echo "== MongoDB Atlas test ==\n";

foreach (describe_mongo_environment() as $k => $v) {
    printf("%s: %s\n", $k, $v === null ? 'null' : $v);
}

try {
    $client = create_mongo_client_with_retry();
    echo "Connected to MongoDB Atlas OK\n";
    $dbName = getenv('MONGO_DB') ?: 'test';
    $db = $client->selectDatabase($dbName);
    $cols = $db->listCollections();
    echo "Collections in {$dbName}:\n";
    foreach ($cols as $c) {
        echo " - " . $c->getName() . "\n";
    }
    exit(0);
} catch (Throwable $e) {
    echo "Mongo test failed: " . $e->getMessage() . "\n";
    exit(2);
}

?>
