<?php
// Helper para conectar con MongoDB Atlas usando la librería mongodb/mongodb.
// Variables de entorno esperadas: MONGO_URI, MONGO_DB, MONGO_CONNECT_RETRIES, MONGO_CONNECT_BACKOFF_MS

use MongoDB\Client;

function create_mongo_client_with_retry(array $opts = [])
{
    $uri = $_ENV['MONGO_URI'] ?? getenv('MONGO_URI');
    if (!$uri) {
        throw new InvalidArgumentException('MONGO_URI is required in environment');
    }

    $attempts = isset($opts['retries']) ? (int) $opts['retries'] : ((getenv('MONGO_CONNECT_RETRIES') !== false) ? (int) getenv('MONGO_CONNECT_RETRIES') : 3);
    $backoffMs = isset($opts['backoff_ms']) ? (int) $opts['backoff_ms'] : ((getenv('MONGO_CONNECT_BACKOFF_MS') !== false) ? (int) getenv('MONGO_CONNECT_BACKOFF_MS') : 500);

    for ($i = 1; $i <= $attempts; $i++) {
        try {
            $client = new Client($uri);
            // ping to verify connection
            $dbName = $_ENV['MONGO_DB'] ?? getenv('MONGO_DB') ?: 'ESCAR_AINVEST';
            $client->selectDatabase($dbName)->command(['ping' => 1]);
            return $client;
        } catch (Throwable $e) {
            error_log("[mongo_helper] attempt {$i}/{$attempts} failed: " . $e->getMessage());
            if ($i === $attempts) {
                throw new RuntimeException("MongoDB connection failed after {$attempts} attempts: " . $e->getMessage());
            }
            usleep($backoffMs * 1000 * (int) pow(2, $i - 1));
        }
    }

    throw new RuntimeException('Unreachable code in create_mongo_client_with_retry');
}

function describe_mongo_environment(): array
{
    return [
        'MONGO_URI' => getenv('MONGO_URI') ? 'set' : null,
        'MONGO_DB' => getenv('MONGO_DB') ? 'set' : null,
        'MONGO_CONNECT_RETRIES' => getenv('MONGO_CONNECT_RETRIES') ?: '3',
    ];
}

?>