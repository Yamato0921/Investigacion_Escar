<?php
header('Content-Type: text/plain');
echo "PHP Version: " . phpversion() . "\n";
echo "MongoDB Extension: " . (extension_loaded('mongodb') ? 'LOADED' : 'MISSING') . "\n";
echo "Vendor Autoload: " . (file_exists(__DIR__ . '/vendor/autoload.php') ? 'EXISTS' : 'MISSING') . "\n";
echo "MONGO_URI: " . (getenv('MONGO_URI') ? 'SET' : 'NOT SET') . "\n";
echo "MONGO_DB: " . (getenv('MONGO_DB') ?: 'NOT SET') . "\n";

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once __DIR__ . '/vendor/autoload.php';
    echo "Autoload loaded successfully.\n";
} catch (Throwable $e) {
    echo "Autoload ERROR: " . $e->getMessage() . "\n";
}
