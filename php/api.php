<?php
require_once 'config.php';

// Configuración de CORS y headers
header('Content-Type: application/json');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Si es una solicitud OPTIONS, terminar aquí
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar si el usuario está autenticado
function isAuthenticated(): bool
{
    return isset($_SESSION['user_id']) && isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

// Manejar la solicitud según el método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            login();
        } elseif ($action === 'logout') {
            logout();
        } elseif (isAuthenticated()) {
            if ($action === 'create' || $action === 'update') {
                handleInvestigador();
            } elseif ($action === 'save_semillero') {
                handleSemillero();
            } elseif ($action === 'save_integrante') {
                handleSemilleroIntegrante();
            } elseif ($action === 'save_proyecto') {
                handleProyecto();
            }
        }
        break;

    case 'GET':
        if ($action === 'list') {
            getInvestigadores();
        } elseif ($action === 'get' && isAuthenticated()) {
            getInvestigador();
        } elseif ($action === 'check_session') {
            checkSession();
        } elseif ($action === 'list_semilleros') {
            getSemilleros();
        } elseif ($action === 'get_semillero') {
            getSemillero();
        } elseif ($action === 'list_proyectos') {
            getProyectos();
        } elseif ($action === 'get_proyecto') {
            getProyecto();
        }
        break;

    case 'DELETE':
        if (isAuthenticated()) {
            if ($action === 'delete') {
                deleteInvestigador();
            } elseif ($action === 'delete_semillero') {
                deleteSemillero();
            } elseif ($action === 'delete_integrante') {
                deleteSemilleroIntegrante();
            } elseif ($action === 'delete_proyecto') {
                deleteProyecto();
            }
        }
        break;
}

function login(): void
{
    global $conn;
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        return;
    }

    try {
        $stmt = $conn->prepare("SELECT id, username, password FROM usuarios WHERE username = ?");
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user exists and verify password (bcrypt or plain text)
        $passwordValid = false;
        if ($user) {
            // Try bcrypt verification first
            if (password_verify($data['password'], $user['password'])) {
                $passwordValid = true;
            }
            // Fallback to plain text comparison (for legacy/testing)
            elseif ($data['password'] === $user['password']) {
                $passwordValid = true;
            }
        }

        if ($passwordValid) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['is_admin'] = true;

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
        }
    } catch (PDOException $e) {
        error_log('Error en login: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en el servidor']);
    }
}

function logout(): void
{
    // Limpiar y destruir la sesión
    $_SESSION = array();
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 42000, '/');
    }
    session_destroy();

    echo json_encode(['success' => true]);
}

function checkSession(): void
{
    // Asegurarse de que la sesión está activa
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (isAuthenticated()) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autenticado']);
    }
}

function getInvestigadores(): void
{
    global $conn;
    try {
        $stmt = $conn->query("SELECT * FROM investigadores ORDER BY nombre");
        $investigadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $investigadores]);
    } catch (PDOException $e) {
        error_log('Error en getInvestigadores: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener los datos']);
    }
}

function getInvestigador(): void
{
    global $conn;
    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
        return;
    }

    try {
        $stmt = $conn->prepare("SELECT * FROM investigadores WHERE id = ?");
        $stmt->execute([$id]);
        $investigador = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($investigador) {
            echo json_encode(['success' => true, 'data' => $investigador]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Investigador no encontrado']);
        }
    } catch (PDOException $e) {
        error_log('Error en getInvestigador: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener el investigador']);
    }
}

// --- Handle Investigador ---
function handleInvestigador(): void
{
    global $conn;

    if (empty($_POST['nombre']) || empty($_POST['correo']) || empty($_POST['area'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
        return;
    }

    $foto = null;
    if (isset($_FILES['foto'])) {
        $imageData = base64_encode(file_get_contents($_FILES['foto']['tmp_name']));
        $foto = 'data:' . $_FILES['foto']['type'] . ';base64,' . $imageData;
    }

    try {
        if (isset($_POST['id']) && !empty($_POST['id'])) {
            // Actualizar
            $stmt = $conn->prepare("UPDATE investigadores SET nombre = ?, correo = ?, area = ?" .
                ($foto ? ", foto = ?" : "") .
                " WHERE id = ?");
            $params = [$_POST['nombre'], $_POST['correo'], $_POST['area']];
            if ($foto) {
                $params[] = $foto;
            }
            $params[] = $_POST['id'];
            $stmt->execute($params);
            echo json_encode(['success' => true, 'id' => $_POST['id']]);
        } else {
            // Crear nuevo
            if (!$foto) {
                // Optional: Allow default photo or warn
                // http_response_code(400);
                // echo json_encode(['success' => false, 'message' => 'La foto es obligatoria']);
                // return;
                $foto = ''; // or default path
            }
            $stmt = $conn->prepare("INSERT INTO investigadores (nombre, correo, area, foto) VALUES (?, ?, ?, ?)");
            $stmt->execute([$_POST['nombre'], $_POST['correo'], $_POST['area'], $foto]);
            echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
        }
    } catch (PDOException $e) {
        error_log('Error en handleInvestigador: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar los datos']);
    }
}

// --- Handle Semillero ---
function handleSemillero(): void
{
    global $conn;
    $id = $_POST['id'] ?? null;
    $nombre = $_POST['nombre'] ?? '';
    // ... validation ...

    // Logo logic
    $logo = null;
    if (isset($_FILES['logo']) && $_FILES['logo']['size'] > 0) {
        $data = base64_encode(file_get_contents($_FILES['logo']['tmp_name']));
        $logo = 'data:' . $_FILES['logo']['type'] . ';base64,' . $data;
    } elseif (isset($_POST['existingLogo'])) {
        $logo = $_POST['existingLogo'];
    }

    try {
        if ($id) {
            // Update...
            $query = "UPDATE semilleros SET nombre=?, codigo=?, responsable=?, unidad_academica=?, acronimo=?, fecha_creacion=?, estado=?";
            $params = [$nombre, $_POST['codigo'], $_POST['responsable'], $_POST['unidadAcademica'], $_POST['acronimo'], $_POST['fechaCreacion'], $_POST['estado']];
            if ($logo) {
                $query .= ", logo=?";
                $params[] = $logo;
            }
            $query .= " WHERE id=?";
            $params[] = $id;
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'id' => $id]);
        } else {
            // Insert
            $stmt = $conn->prepare("INSERT INTO semilleros (nombre, codigo, responsable, unidad_academica, acronimo, fecha_creacion, estado, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$nombre, $_POST['codigo'], $_POST['responsable'], $_POST['unidadAcademica'], $_POST['acronimo'], $_POST['fechaCreacion'], $_POST['estado'], $logo]);
            echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// --- Handle Integrante ---
function handleSemilleroIntegrante(): void
{
    global $conn;
    $semillero_id = $_POST['semilleroId'] ?? null;
    // ...

    $foto = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['size'] > 0) {
        $data = base64_encode(file_get_contents($_FILES['foto']['tmp_name']));
        $foto = 'data:' . $_FILES['foto']['type'] . ';base64,' . $data;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO semilleros_integrantes (semillero_id, nombre, rol, foto) VALUES (?, ?, ?, ?)");
        $stmt->execute([$semillero_id, $_POST['nombre'], $_POST['rol'], $foto]);
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// --- Proyectos Functions ---

function getProyectos(): void
{
    global $conn;
    try {
        $stmt = $conn->query("SELECT * FROM proyectos ORDER BY fecha_publicacion DESC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getProyecto(): void
{
    global $conn;
    $id = $_GET['id'] ?? null;
    if (!$id)
        return;
    $stmt = $conn->prepare("SELECT * FROM proyectos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch(PDO::FETCH_ASSOC)]);
}

function handleProyecto(): void
{
    global $conn;
    $id = $_POST['id'] ?? null;
    $titulo = $_POST['titulo'] ?? '';
    $contenido = $_POST['contenido'] ?? '';

    $imagen = null;
    if (isset($_FILES['imagen']) && $_FILES['imagen']['size'] > 0) {
        $data = base64_encode(file_get_contents($_FILES['imagen']['tmp_name']));
        $imagen = 'data:' . $_FILES['imagen']['type'] . ';base64,' . $data;
    } elseif (isset($_POST['existingImagen'])) {
        $imagen = $_POST['existingImagen'];
    }

    try {
        if ($id) {
            $query = "UPDATE proyectos SET titulo=?, contenido=?";
            $params = [$titulo, $contenido];
            if ($imagen) {
                $query .= ", imagen=?";
                $params[] = $imagen;
            }
            $query .= " WHERE id=?";
            $params[] = $id;
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'id' => $id]);
        } else {
            $stmt = $conn->prepare("INSERT INTO proyectos (titulo, contenido, imagen) VALUES (?, ?, ?)");
            $stmt->execute([$titulo, $contenido, $imagen]);
            echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function deleteProyecto(): void
{
    global $conn;
    $id = $_GET['id'] ?? null;
    if (!$id)
        return;
    $conn->prepare("DELETE FROM proyectos WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
}
