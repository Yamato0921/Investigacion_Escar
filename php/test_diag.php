<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Diagnóstico de Servidor</h1>";
echo "PHP Version: " . phpversion() . "<br>";
echo "MongoDB Extension Loaded: " . (extension_loaded('mongodb') ? 'SÍ' : 'NO') . "<br>";

$autoload = __DIR__ . '/../vendor/autoload.php';
echo "Vendor Autoload exists: " . (file_exists($autoload) ? 'SÍ' : 'NO') . "<br>";

if (file_exists($autoload)) {
    try {
        require_once $autoload;
        echo "Vendor Autoload loaded: SÍ<br>";
        if (class_exists('MongoDB\Client')) {
            echo "MongoDB\Client class exists: SÍ<br>";
        } else {
            echo "MongoDB\Client class exists: NO<br>";
        }
    } catch (Throwable $e) {
        echo "Error loading autoload: " . $e->getMessage() . "<br>";
    }
}

echo "<h2>Variables de Entorno (sin valores sensibles):</h2>";
echo "MONGO_URI defined: " . (getenv('MONGO_URI') ? 'SÍ' : 'NO') . "<br>";
echo "MONGO_DB defined: " . (getenv('MONGO_DB') ? 'SÍ' : 'NO') . "<br>";

phpinfo();
