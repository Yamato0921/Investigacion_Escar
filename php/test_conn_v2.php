<?php
// Script de diagnóstico mejorado para conexiones a DB remotas.
require_once __DIR__ . '/db_helper.php';

echo "== DB Connection Diagnostic v2 ==\n";

$env = describe_connection_environment();
foreach ($env as $k => $v) {
    printf("%s: %s\n", $k, $v === null ? 'null' : $v);
}

// DNS resolution
$host = getenv('DB_HOST') ?: 'sql10.freesqldatabase.com';
echo "\nDNS resolution for {$host}:\n";
$ip = gethostbyname($host);
echo "  Resolved: {$ip}\n";

$port = intval(getenv('DB_PORT') ?: 3306);
echo "\nTCP connectivity test to {$host}:{$port} (timeout 6s):\n";
$ok = check_tcp_connectivity($host, $port, 6);
echo $ok ? "  TCP: open\n" : "  TCP: closed or filtered (blocked)\n";

// Attempt PDO connection with retries
echo "\nAttempting PDO connection (with retries)...\n";
try {
    $pdo = create_pdo_with_retry();
    echo "  PDO connection: success\n";
    $v = $pdo->query('SELECT VERSION() AS v')->fetch();
    echo "  MySQL version: " . ($v['v'] ?? 'unknown') . "\n";
    exit(0);
} catch (Throwable $e) {
    echo "  PDO connection failed: " . $e->getMessage() . "\n";
    echo "\nSuggested actions:\n";
    echo "- Si TCP está 'closed', añade tu IP pública al panel del proveedor (whitelist).\n";
    echo "- Si no puedes whitelist, crea un túnel SSH desde una VPS y reintenta (ver README).\n";
    echo "- Asegúrate de que en php/.env uses DB_HOST (no 'localhost' si la DB es remota) y DB_PORT correcto.\n";
    echo "- Comprueba extensiones: PDO y pdo_mysql deben aparecer en 'php -m'.\n";
    exit(2);
}

?>
