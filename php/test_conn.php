<?php
// Prueba simple de conexión a la base de datos usando bootstrap
require_once __DIR__ . '/bootstrap.php';

try {
    $stmt = $conn->query('SELECT NOW() AS now');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Conexión OK. Hora DB: " . ($row['now'] ?? 'n/a') . PHP_EOL;
} catch (Exception $e) {
    echo "Error conexión: " . $e->getMessage() . PHP_EOL;
}
