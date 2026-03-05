<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/jwt_auth.php';
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/helpers.php';
if (file_exists(__DIR__ . '/validators.php'))
    require_once __DIR__ . '/validators.php';

use MongoDB\BSON\ObjectId;

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Access MongoDB directly
$mongo = $GLOBALS['mongoClient'] ?? null;
if (!$mongo) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'MongoDB no está configurado']);
    exit();
}
$db = $mongo->selectDatabase($_ENV['MONGO_DB'] ?? getenv('MONGO_DB') ?: 'escar_db');

// Helpers
function require_auth(): array
{
    $payload = validate_jwt();
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido o expirado']);
        exit();
    }
    return $payload;
}

function require_admin(array $payload): void
{
    $r = $payload['role'] ?? ($payload['rol'] ?? null);
    if (!$r || !in_array(strtolower($r), ['admin', 'administrador'], true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Permisos insuficientes']);
        exit();
    }
}

function to_obj_id($id)
{
    try {
        return new ObjectId($id);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit();
    }
}

// Ensure first admin user exists setup
if ($method === 'GET' && $action === 'setup_admin') {
    $existing = $db->usuarios->findOne(['username' => 'admin']);
    if (!$existing) {
        $db->usuarios->insertOne([
            'username' => 'admin',
            'password' => 'admin_legacy_pwd', // you can update this via UI later
            'rol' => 'admin'
        ]);
        echo json_encode(['success' => true, 'message' => 'Admin user created. Password is "admin_legacy_pwd"']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Admin user already exists']);
    }
    exit();
}

if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['username']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit();
    }

    try {
        $user = $db->usuarios->findOne(['username' => $data['username']]);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Credenciales inválidas']);
            exit();
        }

        $valid = false;
        if (password_verify($data['password'], $user['password'])) {
            $valid = true;
        } elseif ($data['password'] === $user['password']) { // legacy
            $valid = true;
        }

        if (!$valid) {
            backend_log('WARN', 'Login fallido para ' . $data['username']);
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Credenciales inválidas']);
            exit();
        }

        $token = generate_jwt(['sub' => (string) $user['_id'], 'username' => $user['username'], 'role' => $user['rol'] ?? 'user']);
        backend_log('INFO', 'Usuario autenticado: ' . $user['username']);
        echo json_encode(['success' => true, 'token' => $token, 'user' => ['id' => (string) $user['_id'], 'username' => $user['username']]]);
        exit();
    } catch (Exception $e) {
        backend_log('ERROR', 'Login error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en el servidor']);
        exit();
    }
}

// Investigadores
if ($method === 'GET' && ($action === 'list' || $action === 'list_investigadores')) {
    try {
        $items = $db->investigadores->find([], ['sort' => ['nombre' => 1]])->toArray();
        $res = array_map(function ($i) {
            $i['id'] = (string) $i['_id'];
            unset($i['_id']);
            return (array) $i; }, $items);
        echo json_encode(['success' => true, 'data' => $res]);
        exit();
    } catch (Exception $e) {
        backend_log('ERROR', 'List investigadores error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener datos']);
        exit();
    }
}

if ($method === 'GET' && ($action === 'get' || $action === 'get_investigador')) {
    require_auth();
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID requerido']);
        exit();
    }
    try {
        $item = $db->investigadores->findOne(['_id' => to_obj_id($id)]);
        if (!$item) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'No encontrado']);
            exit();
        }
        $array_item = (array) $item;
        $array_item['id'] = (string) $item['_id'];
        unset($array_item['_id']);
        echo json_encode(['success' => true, 'data' => $array_item]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en el servidor']);
        exit();
    }
}

if ($method === 'POST' && ($action === 'create' || $action === 'update' || $action === 'create_investigador' || $action === 'update_investigador')) {
    $user = require_auth();

    $nombre = $_POST['nombre'] ?? '';
    $correo = $_POST['correo'] ?? '';
    $area = $_POST['area'] ?? '';

    if (empty($_POST)) {
        $body = json_decode(file_get_contents('php://input'), true);
        $nombre = $body['nombre'] ?? '';
        $correo = $body['correo'] ?? '';
        $area = $body['area'] ?? '';
    }

    if (!$nombre || !$correo || !$area) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Campos incompletos']);
        exit();
    }

    $foto = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['size'] > 0) {
        $foto = save_uploaded_file($_FILES['foto'], 'investigadores', ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
    }

    if (!$foto && !empty($_POST['foto']) && strpos($_POST['foto'], 'data:image') === 0) {
        $foto = $_POST['foto'];
    }

    try {
        if ($action === 'update' || $action === 'update_investigador') {
            $id = $_POST['id'] ?? ($_GET['id'] ?? null);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requerido para actualizar']);
                exit();
            }
            $updateFields = ['nombre' => $nombre, 'correo' => $correo, 'area' => $area];
            if ($foto)
                $updateFields['foto'] = $foto;

            $db->investigadores->updateOne(['_id' => to_obj_id($id)], ['$set' => $updateFields]);
            echo json_encode(['success' => true, 'id' => $id]);
            exit();
        } else {
            $insertResult = $db->investigadores->insertOne([
                'nombre' => $nombre,
                'correo' => $correo,
                'area' => $area,
                'foto' => $foto
            ]);
            echo json_encode(['success' => true, 'id' => (string) $insertResult->getInsertedId()]);
            exit();
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar datos']);
        exit();
    }
}

if ($method === 'DELETE' && ($action === 'delete' || $action === 'delete_investigador')) {
    $payload = require_auth();
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID requerido']);
        exit();
    }
    try {
        $db->investigadores->deleteOne(['_id' => to_obj_id($id)]);
        echo json_encode(['success' => true]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error servidor']);
        exit();
    }
}

// Proyectos
if ($action === 'list_proyectos' && $method === 'GET') {
    try {
        $items = $db->proyectos->find([], ['sort' => ['fecha_publicacion' => -1]])->toArray();
        $res = array_map(function ($i) {
            $i['id'] = (string) $i['_id'];
            unset($i['_id']);
            return (array) $i; }, $items);
        echo json_encode(['success' => true, 'data' => $res]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false]);
        exit();
    }
}

if ($action === 'get_proyecto' && $method === 'GET') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        exit();
    }
    try {
        $p = $db->proyectos->findOne(['_id' => to_obj_id($id)]);
        if (!$p) {
            http_response_code(404);
            exit();
        }
        $array_p = (array) $p;
        $array_p['id'] = (string) $p['_id'];
        unset($array_p['_id']);
        echo json_encode(['success' => true, 'data' => $array_p]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($method === 'POST' && ($action === 'create_proyecto' || $action === 'update_proyecto' || $action === 'save_proyecto')) {
    $user = require_auth();
    $titulo = $_POST['titulo'] ?? null;
    $contenido = $_POST['contenido'] ?? null;
    if (!$titulo || !$contenido) {
        http_response_code(400);
        exit();
    }
    $imagen = null;
    if (isset($_FILES['imagen']) && $_FILES['imagen']['size'] > 0) {
        $imagen = save_uploaded_file($_FILES['imagen'], 'proyectos', ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
    }
    if (!$imagen && !empty($_POST['existingImagen']))
        $imagen = $_POST['existingImagen'];
    if (!$imagen && !empty($_POST['imagen']) && strpos($_POST['imagen'], 'data:image') === 0)
        $imagen = $_POST['imagen'];

    try {
        $id = $_POST['id'] ?? null;
        if ($id) {
            $update = ['titulo' => $titulo, 'contenido' => $contenido];
            if ($imagen)
                $update['imagen'] = $imagen;
            $db->proyectos->updateOne(['_id' => to_obj_id($id)], ['$set' => $update]);
            echo json_encode(['success' => true, 'id' => $id]);
            exit();
        } else {
            $res = $db->proyectos->insertOne([
                'titulo' => $titulo,
                'contenido' => $contenido,
                'imagen' => $imagen,
                'fecha_publicacion' => new MongoDB\BSON\UTCDateTime()
            ]);
            echo json_encode(['success' => true, 'id' => (string) $res->getInsertedId()]);
            exit();
        }
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($method === 'DELETE' && $action === 'delete_proyecto') {
    $payload = require_auth();
    require_admin($payload);
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        exit();
    }
    try {
        $db->proyectos->deleteOne(['_id' => to_obj_id($id)]);
        echo json_encode(['success' => true]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

// Semilleros
if ($action === 'list_semilleros' && $method === 'GET') {
    try {
        $items = $db->semilleros->find([], ['sort' => ['nombre' => 1]])->toArray();
        $res = array_map(function ($i) {
            $i['id'] = (string) $i['_id'];
            unset($i['_id']);
            return (array) $i; }, $items);
        echo json_encode(['success' => true, 'data' => $res]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($action === 'get_semillero' && $method === 'GET') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        exit();
    }
    try {
        $s = $db->semilleros->findOne(['_id' => to_obj_id($id)]);
        if (!$s) {
            http_response_code(404);
            exit();
        }
        $array_s = (array) $s;
        $array_s['id'] = (string) $s['_id'];
        unset($array_s['_id']);
        echo json_encode(['success' => true, 'data' => $array_s]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($method === 'POST' && ($action === 'create_semillero' || $action === 'update_semillero' || $action === 'save_semillero')) {
    $user = require_auth();
    $nombre = $_POST['nombre'] ?? null;
    if (!$nombre) {
        http_response_code(400);
        exit();
    }
    $logo = null;
    if (isset($_FILES['logo']) && $_FILES['logo']['size'] > 0) {
        $logo = save_uploaded_file($_FILES['logo'], 'semilleros', ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
    } elseif (!empty($_POST['existingLogo'])) {
        $logo = $_POST['existingLogo'];
    }

    $doc = [
        'nombre' => $_POST['nombre'],
        'codigo' => $_POST['codigo'] ?? '',
        'responsable' => $_POST['responsable'] ?? '',
        'unidad_academica' => $_POST['unidadAcademica'] ?? '',
        'acronimo' => $_POST['acronimo'] ?? '',
        'fecha_creacion' => $_POST['fechaCreacion'] ?? null,
        'estado' => $_POST['estado'] ?? ''
    ];
    if ($logo)
        $doc['logo'] = $logo;

    try {
        $id = $_POST['id'] ?? null;
        if ($id) {
            $db->semilleros->updateOne(['_id' => to_obj_id($id)], ['$set' => $doc]);
            echo json_encode(['success' => true, 'id' => $id]);
            exit();
        } else {
            $res = $db->semilleros->insertOne($doc);
            echo json_encode(['success' => true, 'id' => (string) $res->getInsertedId()]);
            exit();
        }
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($method === 'DELETE' && $action === 'delete_semillero') {
    $payload = require_auth();
    require_admin($payload);
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        exit();
    }
    try {
        $db->semilleros->deleteOne(['_id' => to_obj_id($id)]);
        echo json_encode(['success' => true]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

// Integrantes
if ($action === 'list_integrantes' && $method === 'GET') {
    $sem_id = $_GET['semillero_id'] ?? null;
    if (!$sem_id) {
        http_response_code(400);
        exit();
    }
    try {
        $items = $db->semilleros_integrantes->find(['semillero_id' => $sem_id])->toArray();
        $res = array_map(function ($i) {
            $i['id'] = (string) $i['_id'];
            unset($i['_id']);
            return (array) $i; }, $items);
        echo json_encode(['success' => true, 'data' => $res]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($method === 'POST' && ($action === 'add_integrante' || $action === 'save_integrante')) {
    $user = require_auth();
    $sem_id = $_POST['semilleroId'] ?? null;
    if (!$sem_id || empty($_POST['nombre'])) {
        http_response_code(400);
        exit();
    }
    $foto = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['size'] > 0) {
        $foto = save_uploaded_file($_FILES['foto'], 'integrantes', ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
    } elseif (!empty($_POST['existingFoto'])) {
        $foto = $_POST['existingFoto'];
    }
    try {
        $res = $db->semilleros_integrantes->insertOne(['semillero_id' => $sem_id, 'nombre' => $_POST['nombre'], 'rol' => $_POST['rol'] ?? '', 'foto' => $foto]);
        echo json_encode(['success' => true, 'id' => (string) $res->getInsertedId()]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($method === 'DELETE' && $action === 'delete_integrante') {
    $payload = require_auth();
    require_admin($payload);
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        exit();
    }
    try {
        $db->semilleros_integrantes->deleteOne(['_id' => to_obj_id($id)]);
        echo json_encode(['success' => true]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        exit();
    }
}

if ($method === 'GET' && $action === 'check_session') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(['success' => true]);
        exit();
    }
    // We can also let the JWT token be returned back or re-validated here?
    // Actually our new frontend uses Authorization header.
    // If the frontend calls check_session without token, it will fail.
    // To support token verification safely:
    $payload = validate_jwt();
    if ($payload) {
        echo json_encode(['success' => true, 'user' => ['username' => $payload['username'], 'role' => $payload['role']]]);
        exit();
    }
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No session or token']);
    exit();
}

if ($method === 'POST' && $action === 'logout') {
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(404);
echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
