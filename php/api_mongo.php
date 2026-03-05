<?php
// Temporarily enable errors for debugging Render deployment
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!extension_loaded('mongodb')) {
    die(json_encode(['success' => false, 'message' => 'Error: La extensión de PHP "mongodb" no está cargada en el servidor. Revisa el Dockerfile y los logs de Render.']));
}

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/jwt_auth.php';
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/helpers.php';

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$colParam = $_GET['col'] ?? ($_POST['col'] ?? 'investigadores');

// Connection
$mongo = $GLOBALS['mongoClient'] ?? null;
if (!$mongo) {
    http_response_code(500);
    $msg = $GLOBALS['mongo_init_error'] ?? 'MongoDB no disponible';
    echo json_encode(['success' => false, 'message' => "Error de Conexión: $msg"]);
    exit();
}
$uri = getenv('MONGO_URI') ?: ($_ENV['MONGO_URI'] ?? null); // Added this line
$dbName = getenv('MONGO_DB') ?: ($_ENV['MONGO_DB'] ?? 'ESCAR_AINVEST');
$db = $mongo->selectDatabase($dbName);

// Auth Helpers
function require_auth(): array
{
    $payload = validate_jwt();
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Sesión expirada o inválida']);
        exit();
    }
    return $payload;
}

function to_obj_id($id)
{
    try {
        return new ObjectId($id);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de registro inválido']);
        exit();
    }
}

// Actions
switch ($action) {
    case 'setup_admin':
        try {
            $existing = $db->usuarios->findOne(['username' => 'admin']);
            if ($existing) {
                echo json_encode(['success' => true, 'message' => 'Admin ya existe']);
                exit();
            }
            $db->usuarios->insertOne([
                'username' => 'admin',
                'password' => password_hash('admin123', PASSWORD_BCRYPT),
                'rol' => 'admin',
                'created_at' => new UTCDateTime()
            ]);
            echo json_encode(['success' => true, 'message' => 'Admin creado exitosamente (admin/admin123)']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'login':
        $rawForm = file_get_contents('php://input');
        $data = json_decode($rawForm, true);
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $user = $db->usuarios->findOne(['username' => $username]);
        if ($user && password_verify($password, $user['password'])) {
            $token = generate_jwt([
                'id' => (string) $user['_id'],
                'username' => $user['username'],
                'role' => $user['rol'] ?? 'admin'
            ]);
            echo json_encode(['success' => true, 'token' => $token]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
        }
        break;

    case 'check_session':
        $payload = validate_jwt();
        if ($payload) {
            echo json_encode(['success' => true, 'token' => get_token_from_header()]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false]);
        }
        break;

    case 'list':
        try {
            $cursor = $db->selectCollection($colParam)->find([], ['sort' => ['_id' => -1]]);
            $data = [];
            foreach ($cursor as $doc) {
                $doc['id'] = (string) $doc['_id'];
                unset($doc['_id']);
                $data[] = $doc;
            }
            echo json_encode(['success' => true, 'data' => $data]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            echo json_encode(['success' => false]);
            break;
        }
        $doc = $db->selectCollection($colParam)->findOne(['_id' => to_obj_id($id)]);
        if ($doc) {
            $doc['id'] = (string) $doc['_id'];
            unset($doc['_id']);
            echo json_encode(['success' => true, 'data' => $doc]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No encontrado']);
        }
        break;

    case 'create':
    case 'update':
        require_auth();
        $id = $_POST['id'] ?? ($_GET['id'] ?? null);
        $data = $_POST;
        unset($data['id'], $data['col']);

        // Handle File Uploads
        foreach ($_FILES as $key => $file) {
            if ($file['size'] > 0) {
                $path = save_uploaded_file($file, $colParam, ['image/jpeg', 'image/png', 'image/webp']);
                if ($path)
                    $data[$key] = $path;
            }
        }

        try {
            if ($id && ($action === 'update')) {
                $db->selectCollection($colParam)->updateOne(['_id' => to_obj_id($id)], ['$set' => $data]);
                echo json_encode(['success' => true, 'id' => $id]);
            } else {
                $res = $db->selectCollection($colParam)->insertOne($data);
                echo json_encode(['success' => true, 'id' => (string) $res->getInsertedId()]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'delete':
        require_auth();
        $id = $_GET['id'] ?? ($_POST['id'] ?? null);
        if (!$id) {
            echo json_encode(['success' => false]);
            break;
        }
        try {
            $db->selectCollection($colParam)->deleteOne(['_id' => to_obj_id($id)]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no reconocida']);
        break;
}
