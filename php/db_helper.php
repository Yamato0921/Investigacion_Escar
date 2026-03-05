<?php
// Helper para crear una conexión PDO robusta hacia bases MySQL remotas.
// Usa variables de entorno: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, DB_SOCKET, DB_SSL_CA
// Opciones de conexión: DB_CONNECT_RETRIES, DB_CONNECT_BACKOFF_MS, DB_CONNECT_TIMEOUT

function build_dsn()
{
    $dbName = getenv('DB_NAME') ?: '';
    $socket = getenv('DB_SOCKET');
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';

    if ($socket) {
        return "mysql:unix_socket={$socket};dbname={$dbName};charset=utf8mb4";
    }

    return "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
}

function check_tcp_connectivity(string $host, int $port, float $timeout = 3.0): bool
{
    $errNo = 0;
    $errStr = '';
    $fp = @fsockopen($host, $port, $errNo, $errStr, (int)ceil($timeout));
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

function create_pdo_with_retry(array $opts = [])
{
    $attempts = isset($opts['retries']) ? (int)$opts['retries'] : ((getenv('DB_CONNECT_RETRIES') !== false) ? (int)getenv('DB_CONNECT_RETRIES') : 3);
    $backoffMs = isset($opts['backoff_ms']) ? (int)$opts['backoff_ms'] : ((getenv('DB_CONNECT_BACKOFF_MS') !== false) ? (int)getenv('DB_CONNECT_BACKOFF_MS') : 500);
    $timeout = isset($opts['timeout']) ? (int)$opts['timeout'] : ((getenv('DB_CONNECT_TIMEOUT') !== false) ? (int)getenv('DB_CONNECT_TIMEOUT') : 5);

    $dsn = build_dsn();
    $user = getenv('DB_USER') ?: '';
    $pass = getenv('DB_PASS') ?: '';

    $pdoOptions = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    // optional SSL CA
    $sslCa = getenv('DB_SSL_CA');
    if ($sslCa) {
        if (defined('PDO::MYSQL_ATTR_SSL_CA')) {
            $pdoOptions[PDO::MYSQL_ATTR_SSL_CA] = $sslCa;
        }
    }

    // Try to detect host and port for quick tcp check
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = intval(getenv('DB_PORT') ?: 3306);

    for ($i = 1; $i <= $attempts; $i++) {
        try {
            // quick TCP connectivity check when not using socket
            if (!getenv('DB_SOCKET')) {
                $ok = check_tcp_connectivity($host, $port, $timeout);
                if (!$ok) {
                    throw new RuntimeException("TCP connection to {$host}:{$port} failed or blocked");
                }
            }

            $pdo = new PDO($dsn, $user, $pass, $pdoOptions);
            // small ping
            $stmt = $pdo->query('SELECT 1');
            $stmt->closeCursor();
            return $pdo;
        } catch (Throwable $e) {
            $msg = $e->getMessage();
            error_log("[db_helper] attempt {$i}/{$attempts} failed: {$msg}");
            if ($i === $attempts) {
                throw new RuntimeException("DB connection failed after {$attempts} attempts: {$msg}");
            }
            usleep($backoffMs * 1000 * (int)pow(2, $i - 1));
        }
    }

    throw new RuntimeException('Unreachable code in create_pdo_with_retry');
}

function describe_connection_environment(): array
{
    return [
        'DB_HOST' => getenv('DB_HOST'),
        'DB_PORT' => getenv('DB_PORT'),
        'DB_SOCKET' => getenv('DB_SOCKET'),
        'DB_NAME' => getenv('DB_NAME') ? '***' : null,
        'DB_USER' => getenv('DB_USER') ? '***' : null,
        'DB_SSL_CA' => getenv('DB_SSL_CA') ? 'set' : null,
        'PDO' => extension_loaded('pdo') ? 'ok' : 'missing',
        'PDO_MYSQL' => extension_loaded('pdo_mysql') ? 'ok' : 'missing',
    ];
}

?>
