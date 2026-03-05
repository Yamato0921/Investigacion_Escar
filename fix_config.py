import codecs

with codecs.open('php/config.php', 'r', 'utf-8') as f:
    data = f.read()

data = data.replace("""try {
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
}""", """
// Se eliminó la conexión a MySQL PDO por defecto.
$conn = null;
""")

with codecs.open('php/config.php', 'w', 'utf-8') as f:
    f.write(data)

