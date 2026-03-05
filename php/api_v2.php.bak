<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/jwt_auth.php';
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/helpers.php';
if (file_exists(__DIR__ . '/validators.php')) require_once __DIR__ . '/validators.php';

// Ruta: php/api_v2.php?action=...
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helpers
function require_auth(): array {
    $payload = validate_jwt();
    if (!$payload) {
        respond_error('Token inválido o expirado', 401);
    }
    return $payload;
}

function require_admin(array $payload): void {
    $r = $payload['role'] ?? ($payload['rol'] ?? null);
    if (!$r || !in_array(strtolower($r), ['admin', 'administrador'], true)) {
        respond_error('Permisos insuficientes', 403);
    }
}

if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['username']) || empty($data['password'])) {
        respond_error('Datos incompletos', 400);
    }

    try {
        $stmt = $conn->prepare('SELECT id, username, password, rol AS role FROM usuarios WHERE username = ? LIMIT 1');
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            respond_error('Credenciales inválidas', 401);
        }

        $valid = false;
        if (password_verify($data['password'], $user['password'])) {
            $valid = true;
        } elseif ($data['password'] === $user['password']) { // legacy
            $valid = true;
        }

        if (!$valid) {
            backend_log('WARN', 'Login fallido para ' . $data['username']);
            respond_error('Credenciales inválidas', 401);
        }

        $token = generate_jwt(['sub' => $user['id'], 'username' => $user['username'], 'role' => $user['role'] ?? 'user']);
        backend_log('INFO', 'Usuario autenticado: ' . $user['username']);
        respond_ok(['token' => $token]);
    } catch (PDOException $e) {
        backend_log('ERROR', 'Login error: ' . $e->getMessage());
        respond_error('Error en el servidor', 500);
    }
}

// Ejemplo de endpoint público: listar investigadores
if ($method === 'GET' && $action === 'list_investigadores') {
    try {
        $stmt = $conn->query('SELECT id, nombre, correo, area, foto FROM investigadores ORDER BY nombre');
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond_ok($items);
    } catch (PDOException $e) {
        backend_log('ERROR', 'List investigadores error: ' . $e->getMessage());
        respond_error('Error al obtener datos', 500);
    }
}

// Obtener investigador (protegido)
if ($method === 'GET' && $action === 'get_investigador') {
    require_auth();
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID requerido']);
        exit();
    }
    try {
        $stmt = $conn->prepare('SELECT * FROM investigadores WHERE id = ?');
        $stmt->execute([$id]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$item) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'No encontrado']);
            exit();
        }
        echo json_encode(['success' => true, 'data' => $item]);
        exit();
    } catch (PDOException $e) {
        backend_log('ERROR', 'Get investigador error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en el servidor']);
        exit();
    }
}

// Crear/actualizar investigador (protegido). Espera multipart/form-data para foto.
if ($method === 'POST' && ($action === 'create_investigador' || $action === 'update_investigador')) {
    $user = require_auth();

    // Soporta tanto JSON como form-data. Prioriza form-data para archivos.
    if (!empty($_POST)) {
        $nombre = $_POST['nombre'] ?? '';
        $correo = $_POST['correo'] ?? '';
        $area = $_POST['area'] ?? '';
    } else {
        $body = json_decode(file_get_contents('php://input'), true);
        $nombre = $body['nombre'] ?? '';
        $correo = $body['correo'] ?? '';
        $area = $body['area'] ?? '';
    }


    if (!$nombre || !$correo || !$area) {
        respond_error('Campos obligatorios incompletos', 400);
    }

    // Validaciones
    if (!is_valid_string($nombre, 2, 150)) respond_error('Nombre inválido', 400);
    if (!is_valid_email($correo)) respond_error('Correo inválido', 400);
    if (!is_valid_string($area, 2, 100)) respond_error('Área inválida', 400);

    $foto = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['size'] > 0) {
        $allowed = ['image/jpeg', 'image/png', 'image/webp'];
        $check = validate_file_upload($_FILES['foto'], $allowed, 5 * 1024 * 1024);
        if (!$check['ok']) respond_error('Foto inválida: ' . $check['message'], 400);
        $foto = save_uploaded_file($_FILES['foto'], 'investigadores', $allowed, 5 * 1024 * 1024);
        if (!$foto) respond_error('Error al guardar la foto', 500);
    }

    try {
        if ($action === 'update_investigador') {
            $id = $_POST['id'] ?? ($_GET['id'] ?? null);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requerido para actualizar']);
                exit();
            }
            $query = 'UPDATE investigadores SET nombre = ?, correo = ?, area = ?';
            $params = [$nombre, $correo, $area];
            if ($foto) {
                $query .= ', foto = ?';
                $params[] = $foto;
            }
            $query .= ' WHERE id = ?';
            $params[] = $id;
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'id' => $id]);
            exit();
        } else {
            $stmt = $conn->prepare('INSERT INTO investigadores (nombre, correo, area, foto) VALUES (?, ?, ?, ?)');
            $stmt->execute([$nombre, $correo, $area, $foto]);
            echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
            exit();
        }
    } catch (PDOException $e) {
        backend_log('ERROR', 'Save investigador error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar datos']);
        exit();
    }
}

// Register user
if ($method === 'POST' && $action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['username']) || empty($data['password'])) {
        respond_error('username y password requeridos', 400);
    }
    $username = trim($data['username']);
    $password_raw = $data['password'];
    if (!is_valid_string($username, 3, 100)) respond_error('username inválido', 400);
    if (!is_valid_string($password_raw, 8, 200)) respond_error('password debe tener al menos 8 caracteres', 400);
    $password = password_hash($password_raw, PASSWORD_BCRYPT);
    $role = $data['role'] ?? 'user';
    try {
        $stmt = $conn->prepare('SELECT id FROM usuarios WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            respond_error('Usuario ya existe', 409);
        }
        $stmt = $conn->prepare('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)');
        $stmt->execute([$username, $password, $role]);
        backend_log('INFO', 'Usuario registrado: ' . $username);
        respond_ok(['id' => $conn->lastInsertId()]);
    } catch (PDOException $e) {
        backend_log('ERROR', 'Register error: ' . $e->getMessage());
        respond_error('Error en servidor', 500);
    }
}

// Endpoints para proyectos
if ($action === 'list_proyectos' && $method === 'GET') {
    try {
        $stmt = $conn->query('SELECT id, titulo, fecha_publicacion, imagen FROM proyectos ORDER BY fecha_publicacion DESC');
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond_ok($items);
    } catch (PDOException $e) {
        backend_log('ERROR', 'List proyectos error: ' . $e->getMessage());
        respond_error('Error al obtener datos', 500);
    }
}

if ($action === 'get_proyecto' && $method === 'GET') {
    $id = $_GET['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
    try {
        $stmt = $conn->prepare('SELECT * FROM proyectos WHERE id = ?');
        $stmt->execute([$id]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$p) respond_error('No encontrado', 404);
        respond_ok($p);
    } catch (PDOException $e) {
        backend_log('ERROR', 'Get proyecto error: ' . $e->getMessage());
        respond_error('Error servidor', 500);
    }
}

if ($method === 'POST' && ($action === 'create_proyecto' || $action === 'update_proyecto')) {
    $user = require_auth();
    $titulo = $_POST['titulo'] ?? null;
    $contenido = $_POST['contenido'] ?? null;
    if (!$titulo || !$contenido) respond_error('Campos incompletos', 400);
    if (!is_valid_string($titulo, 3, 200)) respond_error('Título inválido', 400);
    if (!is_valid_string($contenido, 3, 100000)) respond_error('Contenido inválido', 400);
    $imagen = null;
    if (isset($_FILES['imagen']) && $_FILES['imagen']['size']>0) {
        $allowed = ['image/jpeg','image/png','image/webp'];
        $check = validate_file_upload($_FILES['imagen'], $allowed, 5*1024*1024);
        if (!$check['ok']) respond_error('Imagen inválida: ' . $check['message'], 400);
        $imagen = save_uploaded_file($_FILES['imagen'], 'proyectos', $allowed, 5*1024*1024);
        if (!$imagen) respond_error('Error al guardar imagen', 500);
    }
    try {
        if ($action === 'update_proyecto') {
            $id = $_POST['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
            $query = 'UPDATE proyectos SET titulo=?, contenido=?' . ($imagen ? ', imagen=?' : '') . ' WHERE id=?';
            $params = [$titulo, $contenido]; if ($imagen) $params[]=$imagen; $params[]=$id;
            $stmt=$conn->prepare($query); $stmt->execute($params);
            echo json_encode(['success'=>true,'id'=>$id]); exit();
        } else {
            $stmt=$conn->prepare('INSERT INTO proyectos (titulo, contenido, imagen, fecha_publicacion) VALUES (?, ?, ?, NOW())');
            $stmt->execute([$titulo, $contenido, $imagen]);
            echo json_encode(['success'=>true,'id'=>$conn->lastInsertId()]); exit();
        }
    } catch (PDOException $e) {
        backend_log('ERROR','Save proyecto error: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit();
    }
}

// Convocatorias endpoints
if ($action === 'list_convocatorias' && $method === 'GET') {
    try { $stmt=$conn->query('SELECT id,titulo,fecha_inicio,fecha_fin,archivo FROM convocatorias ORDER BY created_at DESC'); $items=$stmt->fetchAll(PDO::FETCH_ASSOC); echo json_encode(['success'=>true,'data'=>$items]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','List convocatorias: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

if ($action === 'get_convocatoria' && $method === 'GET') {
    $id = $_GET['id'] ?? null; if (!$id){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
    try { $stmt=$conn->prepare('SELECT * FROM convocatorias WHERE id=?'); $stmt->execute([$id]); $c=$stmt->fetch(PDO::FETCH_ASSOC); if (!$c){ http_response_code(404); echo json_encode(['success'=>false,'message'=>'No encontrado']); exit(); } echo json_encode(['success'=>true,'data'=>$c]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','Get convocatoria: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

if ($method === 'POST' && ($action === 'create_convocatoria' || $action === 'update_convocatoria')) {
    $user = require_auth();
    $titulo = $_POST['titulo'] ?? null; $descripcion = $_POST['descripcion'] ?? null; if (!$titulo || !$descripcion){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'Campos incompletos']); exit(); }
    $archivo = null; if (isset($_FILES['archivo']) && $_FILES['archivo']['size']>0) $archivo = save_uploaded_file($_FILES['archivo'],'convocatorias');
    try {
        if ($action === 'update_convocatoria') {
            $id = $_POST['id'] ?? null; if (!$id){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
            $query = 'UPDATE convocatorias SET titulo=?, descripcion=?, fecha_inicio=?, fecha_fin=?' . ($archivo? ', archivo=?':'') . ' WHERE id=?';
            $params = [$titulo, $descripcion, $_POST['fecha_inicio']??null, $_POST['fecha_fin']??null]; if ($archivo) $params[]=$archivo; $params[]=$id;
            $stmt=$conn->prepare($query); $stmt->execute($params); echo json_encode(['success'=>true,'id'=>$id]); exit();
        } else {
            $stmt=$conn->prepare('INSERT INTO convocatorias (titulo, descripcion, fecha_inicio, fecha_fin, archivo) VALUES (?,?,?,?,?)');
            $stmt->execute([$titulo, $descripcion, $_POST['fecha_inicio']??null, $_POST['fecha_fin']??null, $archivo]);
            echo json_encode(['success'=>true,'id'=>$conn->lastInsertId()]); exit();
        }
    } catch(PDOException $e){ backend_log('ERROR','Save convocatoria: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

if ($method === 'DELETE' && $action === 'delete_convocatoria') {
    $payload = require_auth(); require_admin($payload);
    $id = $_GET['id'] ?? null; if (!$id){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
    try{ $stmt=$conn->prepare('DELETE FROM convocatorias WHERE id=?'); $stmt->execute([$id]); backend_log('INFO','Convocatoria eliminada id='.$id); echo json_encode(['success'=>true]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','Delete convocatoria: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

// Delete proyecto (admin)
if ($method === 'DELETE' && $action === 'delete_proyecto') {
    $payload = require_auth();
    require_admin($payload);
    $id = $_GET['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
    try { $stmt=$conn->prepare('DELETE FROM proyectos WHERE id=?'); $stmt->execute([$id]); backend_log('INFO','Proyecto eliminado id='.$id); echo json_encode(['success'=>true]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','Delete proyecto: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

// Semilleros endpoints
if ($action === 'list_semilleros' && $method === 'GET') {
    try { $stmt=$conn->query('SELECT id, nombre, codigo, responsable, unidad_academica, acronimo, fecha_creacion, estado, logo FROM semilleros ORDER BY nombre'); $items=$stmt->fetchAll(PDO::FETCH_ASSOC); echo json_encode(['success'=>true,'data'=>$items]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','List semilleros: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

if ($action === 'get_semillero' && $method === 'GET') {
    $id = $_GET['id'] ?? null; if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
    try { $stmt=$conn->prepare('SELECT * FROM semilleros WHERE id=?'); $stmt->execute([$id]); $s=$stmt->fetch(PDO::FETCH_ASSOC); if (!$s){ http_response_code(404); echo json_encode(['success'=>false,'message'=>'No encontrado']); exit(); } echo json_encode(['success'=>true,'data'=>$s]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','Get semillero: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

if ($method === 'POST' && ($action === 'create_semillero' || $action === 'update_semillero')) {
    $user = require_auth();
    $nombre = $_POST['nombre'] ?? null; if (!$nombre){ respond_error('nombre requerido', 400); }
    if (!is_valid_string($nombre, 2, 150)) respond_error('nombre inválido', 400);
    $logo = null; if (isset($_FILES['logo']) && $_FILES['logo']['size']>0) {
        $allowed = ['image/jpeg','image/png','image/webp'];
        $check = validate_file_upload($_FILES['logo'], $allowed, 5*1024*1024);
        if (!$check['ok']) respond_error('Logo inválido: ' . $check['message'], 400);
        $logo = save_uploaded_file($_FILES['logo'],'semilleros', $allowed, 5*1024*1024);
        if (!$logo) respond_error('Error al guardar logo', 500);
    }
    try {
        if ($action === 'update_semillero') {
            $id = $_POST['id'] ?? null; if (!$id){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
            $query = 'UPDATE semilleros SET nombre=?, codigo=?, responsable=?, unidad_academica=?, acronimo=?, fecha_creacion=?, estado=?' . ($logo? ', logo=?':'') . ' WHERE id=?';
            $params = [$_POST['nombre'], $_POST['codigo']??'', $_POST['responsable']??'', $_POST['unidadAcademica']??'', $_POST['acronimo']??'', $_POST['fechaCreacion']??null, $_POST['estado']??'']; if ($logo) $params[]=$logo; $params[]=$id;
            $stmt=$conn->prepare($query); $stmt->execute($params); echo json_encode(['success'=>true,'id'=>$id]); exit();
        } else {
            $stmt=$conn->prepare('INSERT INTO semilleros (nombre,codigo,responsable,unidad_academica,acronimo,fecha_creacion,estado,logo) VALUES (?,?,?,?,?,?,?,?)');
            $stmt->execute([$_POST['nombre'], $_POST['codigo']??'', $_POST['responsable']??'', $_POST['unidadAcademica']??'', $_POST['acronimo']??'', $_POST['fechaCreacion']??null, $_POST['estado']??'', $logo]);
            echo json_encode(['success'=>true,'id'=>$conn->lastInsertId()]); exit();
        }
    } catch(PDOException $e){ backend_log('ERROR','Save semillero: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

// Semillero integrantes
if ($action === 'list_integrantes' && $method === 'GET') {
    $sem_id = $_GET['semillero_id'] ?? null; if (!$sem_id){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'semillero_id requerido']); exit(); }
    try { $stmt=$conn->prepare('SELECT id, nombre, rol, foto FROM semilleros_integrantes WHERE semillero_id=?'); $stmt->execute([$sem_id]); $items=$stmt->fetchAll(PDO::FETCH_ASSOC); echo json_encode(['success'=>true,'data'=>$items]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','List integrantes: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

if ($method === 'POST' && $action === 'add_integrante') {
    $user = require_auth();
    $sem_id = $_POST['semilleroId'] ?? null; if (!$sem_id || empty($_POST['nombre'])){ respond_error('Campos requeridos', 400); }
    if (!is_valid_string($_POST['nombre'], 2, 150)) respond_error('Nombre inválido', 400);
    $foto = null; if (isset($_FILES['foto']) && $_FILES['foto']['size']>0) {
        $allowed = ['image/jpeg','image/png','image/webp'];
        $check = validate_file_upload($_FILES['foto'], $allowed, 5*1024*1024);
        if (!$check['ok']) respond_error('Foto inválida: ' . $check['message'], 400);
        $foto = save_uploaded_file($_FILES['foto'],'integrantes', $allowed, 5*1024*1024);
        if (!$foto) respond_error('Error al guardar foto', 500);
    }
    try { $stmt=$conn->prepare('INSERT INTO semilleros_integrantes (semillero_id,nombre,rol,foto) VALUES (?,?,?,?)'); $stmt->execute([$sem_id, $_POST['nombre'], $_POST['rol']??'', $foto]); echo json_encode(['success'=>true,'id'=>$conn->lastInsertId()]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','Add integrante: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}

// Delete integrante (admin)
if ($method === 'DELETE' && $action === 'delete_integrante') {
    $payload = require_auth(); require_admin($payload);
    $id = $_GET['id'] ?? null; if (!$id){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID requerido']); exit(); }
    try{ $stmt=$conn->prepare('DELETE FROM semilleros_integrantes WHERE id=?'); $stmt->execute([$id]); backend_log('INFO','Integrante eliminado id='.$id); echo json_encode(['success'=>true]); exit(); }
    catch(PDOException $e){ backend_log('ERROR','Delete integrante: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Error servidor']); exit(); }
}



// El resto de endpoints (semilleros, proyectos, etc.) pueden implementarse siguiendo estos patrones.

http_response_code(404);
echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
